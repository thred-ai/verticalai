import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Executable } from '../models/workflow/executable.model';
import { WorkflowComponent } from '../workflow/workflow.component';
import { TaskTree } from '../models/workflow/task-tree.model';
import { Dict, LoadService } from '../load.service';
import { BehaviorSubject } from 'rxjs';
import { Step } from 'sequential-workflow-designer';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
})
export class DatabaseComponent implements OnInit {
  executable?: Executable;

  items?: TaskTree[] = undefined;

  selectedFile?: Step;

  loading = false;
  loadingCol: Dict<boolean> = {};

  constructor(
    private workflowComponent: WorkflowComponent,
    private loadService: LoadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.workflowComponent.openStep.subscribe((step) => {
      if (step) {
        this.selectedFile = step;

        this.workflowComponent.workflow.subscribe((w) => {
          this.executable = w;

          if (w && this.selectedFile) {
            this.loadService.getDatabaseInfo(
              w.id,
              this.selectedFile.id,
              (docs) => {
                this.items = Object.keys(docs).map((key) => {
                  return new TaskTree(key, key, 'category', []);
                });

                if (this.items[0]) {
                  this.openCollection(this.items[0]);
                } else {
                  this.loading = false;
                }
              }
            );
          }
        });
      }
    });
  }

  accordionOpened(event: any, item: TaskTree) {
    let ids = event.detail.value as string[];
    if (ids && ids.includes(item.id)) {
      this.openCollection(item);
    }
  }

  openMenu($event: Event){
    $event.stopPropagation()
    $event.preventDefault()
    console.log("meu")
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
            collection.sequence = Object.keys(docs).map((key, index) => {
              return new TaskTree(key, key, 'model', [], undefined, docs[key]);
            });
          }
          this.loading = false;
          delete this.loadingCol[collection.id];
          this.cdr.detectChanges();
        }
      );
    }
  }

  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger?: MatMenuTrigger;
  menuTopLeftPosition = { x: '0', y: '0' };

  onRightClick(event: MouseEvent, task: TaskTree) {
    // preventDefault avoids to show the visualization of the right-click menu of the browser
    event.stopPropagation()
    event.preventDefault();

    console.log(task)

    // we record the mouse position in our object
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';

    // we open the menu
    // we pass to the menu the information about our object
    this.matMenuTrigger!.menuData = { item: task };

    // we open the menu
    this.matMenuTrigger!.openMenu();
  }


  async deleteCollection(collection: TaskTree){
    if (this.executable && this.selectedFile) {
      await this.loadService.deleteDatabaseCollection(
        this.executable.id,
        this.selectedFile.id,
        collection.id
      );
      this.cdr.detectChanges();
    }
  }
  
}
