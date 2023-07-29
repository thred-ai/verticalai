import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Executable } from '../models/workflow/executable.model';
import { WorkflowComponent } from '../workflow/workflow.component';
import { TaskTree } from '../models/workflow/task-tree.model';
import { Dict, LoadService } from '../load.service';
import { BehaviorSubject } from 'rxjs';
import { Step } from 'vertical-ai-designer';
import { MatMenuTrigger } from '@angular/material/menu';
import { Document } from '../models/workflow/document.model';
import { Collection } from '../models/workflow/collection.model';
import { MatDialog } from '@angular/material/dialog';
import { CollectionInfoComponent } from '../collection-info/collection-info.component';
import { TextAreaRenderPipe } from '../text-area-render.pipe';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
})
export class DatabaseComponent implements OnInit {
  executable?: Executable | null;

  items?: TaskTree[] = undefined;

  selectedFile?: Step;

  loading = false;
  loadingCol: Dict<boolean> = {};

  editingDocs: Dict<string> = {};

  constructor(
    private workflowComponent: WorkflowComponent,
    private loadService: LoadService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;

    console.log('oi');
    this.workflowComponent.openStep.subscribe((step) => {
      console.log(step);
      if (step) {
        this.selectedFile = step;

        this.workflowComponent.workflow.subscribe((w) => {
          this.executable = w;

          if (w && this.selectedFile) {
            this.loadService.getDatabaseInfo(
              w.id,
              this.selectedFile.id,
              (docs) => {
                this.items = Object.values(docs).map((col) => {
                  let task = this.colToTaskTree(col);

                  return task;
                });

                this.loading = false;
              }
            );
          }
        });
      }
    });
  }

  accordionOpened(event: any, item: TaskTree) {
    console.log(event);
    if (event.srcElement.id == 'accordion') {
      let ids = event.detail.value as string[];
      if (ids && ids.includes(item.id)) {
        this.openCollection(item);
      }
    }
  }

  openMenu($event: Event) {
    $event.stopPropagation();
    $event.preventDefault();
    console.log('meu');
  }

  openCollection(collection: TaskTree) {
    if (this.executable && this.selectedFile) {
      this.loadingCol[collection.id] = true;
      this.loadService.getDatabaseCollection(
        this.executable.id,
        this.selectedFile.id,
        collection.id,
        (docs) => {
          if (docs) {
            let pipe = new TextAreaRenderPipe();
            collection.sequence = Object.values(docs).map((doc, index) => {
              doc.text = pipe.transform(doc.text);
              return this.docToTaskTree(doc);
            });
          }
          this.loading = false;
          delete this.loadingCol[collection.id];
          this.cdr.detectChanges();
        }
      );
    }
  }

  docToTaskTree(doc: Document) {
    return new TaskTree(doc.id, doc.id, 'model', [], undefined, doc);
  }

  colToTaskTree(col: Collection) {
    return new TaskTree(col.id, col.id, 'category', []);
  }

  taskTreeToDoc(doc: TaskTree) {
    return doc.metadata as Document;
  }

  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger?: MatMenuTrigger;
  menuTopLeftPosition = { x: '0', y: '0' };

  onRightClick(event: MouseEvent, task: TaskTree) {
    // preventDefault avoids to show the visualization of the right-click menu of the browser
    event.stopPropagation();
    event.preventDefault();

    console.log(task);

    // we record the mouse position in our object
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';

    // we open the menu
    // we pass to the menu the information about our object
    this.matMenuTrigger!.menuData = { item: task };

    // we open the menu
    this.matMenuTrigger!.openMenu();
  }

  async deleteCollection(collection: TaskTree) {
    if (this.executable && this.selectedFile) {
      await this.loadService.deleteDatabaseCollection(
        this.executable.id,
        this.selectedFile.id,
        collection.id
      );
      this.cdr.detectChanges();
    }
  }

  async newCollection() {
    if (this.executable && this.selectedFile) {
      let ref = this.dialog.open(CollectionInfoComponent, {
        width: 'calc(var(--vh, 1vh) * 70)',
        maxWidth: '650px',
        maxHeight: 'calc(var(--vh, 1vh) * 100)',
        panelClass: 'app-full-bleed-dialog',

        data: {
          workflow: this.executable,
          file: this.selectedFile,
        },
      });

      ref.afterClosed().subscribe(async (val) => {
        if (val && val != '' && val != '0') {
          this.loading = true;

          this.cdr.detectChanges();
          let col = val as Collection;

          setTimeout(async () => {
            await this.loadService.createDatabaseCollection(
              this.executable!.id,
              this.selectedFile!.id,
              col
            );
          }, 750);
        }
      });
      // let col = new Collection
      // await this.loadService.createDatabaseCollection(
      //   this.executable.id,
      //   this.selectedFile.id,
      // );
      this.cdr.detectChanges();
    }
  }

  async deleteCollectionDoc(doc: TaskTree) {
    if (this.executable && this.selectedFile) {
      await this.loadService.deleteDatabaseCollectionDoc(
        this.executable.id,
        this.selectedFile.id,
        doc.metadata['collection'],
        doc.id
      );
      this.cdr.detectChanges();
    }
  }

  newDoc(collection: TaskTree, docId: string = this.loadService.newUtilID) {
    let doc = new Document(docId, '', 0, collection.id);

    //save doc

    collection.sequence.unshift(this.docToTaskTree(doc));
  }

  editDoc(event: any, doc: TaskTree) {
    if (event.srcElement.id == 'textArea') {
      let text = event.detail.value;

      if (text && text.split(' ').join('') != '') {
        this.editingDocs[doc.id] = text;
      } else if (this.editingDocs[doc.id]) {
        delete this.editingDocs[doc.id];
      }
    }
  }

  async updateDoc(doc: TaskTree) {
    if (this.executable && this.selectedFile) {
      if (doc) {
        if (this.editingDocs[doc.id]) {
          doc.metadata['text'] = JSON.parse(
            JSON.stringify(this.editingDocs[doc.id])
          );
          delete this.editingDocs[doc.id];
        }
        let document = this.taskTreeToDoc(doc);

        await this.loadService.updateDatabaseCollectionDoc(
          this.executable.id,
          this.selectedFile.id,
          document.collection,
          document.id,
          document
        );
      }
    }
  }
}
