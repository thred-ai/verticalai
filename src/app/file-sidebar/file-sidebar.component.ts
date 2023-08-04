import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  Sequence,
  BranchedStep,
  SequentialStep,
} from 'sequential-workflow-designer';
import { Dict, LoadService } from '../load.service';
import { AIModelType } from '../models/workflow/ai-model-type.model';
import { APIRequest } from '../models/workflow/api-request.model';
import { Key } from '../models/workflow/key.model';
import { TaskTree } from '../models/workflow/task-tree.model';
import { TrainingData } from '../models/workflow/training-data.model';
import { Trigger } from '../models/workflow/trigger.model';
import { WorkflowComponent } from '../workflow/workflow.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { Executable } from '../models/workflow/executable.model';
import { Developer } from '../models/user/developer.model';

@Component({
  selector: 'app-file-sidebar',
  templateUrl: './file-sidebar.component.html',
  styleUrls: ['./file-sidebar.component.scss'],
})
export class FileSidebarComponent implements OnInit {
  workflow?: Executable;

  editingTask?: TaskTree;

  //
  @Input() models: Dict<AIModelType> = {};
  // flowModels: Dict<AIModelType> = {};

  @Input() triggers: Dict<Trigger> = {};
  @Input() trainingData: Dict<TrainingData> = {};
  @Input() apiKeys: Dict<Key> = {};
  @Input() apiRequests: Dict<APIRequest> = {};
  @Input() executable?: Executable;
  @Input() selectedIcon?: string;

  @Output() detailsChanged = new EventEmitter<Executable>();
  @Output() selectedFileChanged = new EventEmitter<string>();
  @Output() publish = new EventEmitter<Executable>();
  @Output() openProj = new EventEmitter<string | undefined>();

  loadedUser?: Developer;

  @Input() items: TaskTree[] = [];

  selectedFile?: string;

  loading: Boolean = false;

  constructor(
    private workflowComponent: WorkflowComponent,
    private loadService: LoadService,
    private cdr: ChangeDetectorRef
  ) {}

  public saveLayout() {
    // this.definition = definition;

    this.loading = true;

    this.publish.emit(this.workflow);
  }

  removeFile(id: string) {
    let file = this.workflowComponent.findSequenceOfStep(
      id,
      this.workflow?.layout.sequence ?? []
    );

    if (this.loadService.confirmDelete()) {
      if (file && this.workflow && this.selectedIcon) {
        let index = file.findIndex((f) => f.id == id);
        if (index > -1) {
          file.splice(index, 1);
          this.detailsChanged.emit(this.workflow);

          if (this.selectedIcon == 'controllers') {
            this.workflowComponent.setWorkflow(this.workflow!.id, 'main');
          }
        }
      }
    }
  }

  ngOnInit(): void {
    this.workflowComponent.workflow.subscribe((w) => {
      if (w) {
        this.workflow = w;
      }
    });
    this.workflowComponent.openStep.subscribe((step) => {
      if (step) {
        this.selectedFile = step.id;
        this.cdr.detectChanges();
      }
    });
    this.loadService.loadedUser.subscribe((l) => {
      if (l) {
        this.loadedUser = l;
      }
    });
    // this.workflowComponent.items.subscribe((i) => {
    //   if (this.workflow) {
    //     this.selectedFile =
    //       this.workflowComponent.openFileId ?? this.items[0]?.type == 'model'
    //         ? this.items[0].id
    //         : this.items[0]?.categoryTask?.id;
    //   }
    // });

    this.loadService.loading.subscribe((l) => {
      this.loading = l;
    });
  }

  saveFieldName(obj: TaskTree, newName: any = '') {
    let name = newName as string;

    if (name && name.trim() != '') {
      obj.name = newName;
    }
    this.editingTask = undefined;

    this.saveLayout();
  }

  checkName() {}

  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger?: MatMenuTrigger;
  menuTopLeftPosition = { x: '0', y: '0' };

  onRightClick(event: MouseEvent, task: TaskTree) {
    // preventDefault avoids to show the visualization of the right-click menu of the browser
    event.preventDefault();
    event.stopPropagation();

    // we record the mouse position in our object
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';

    // we open the menu
    // we pass to the menu the information about our object
    this.matMenuTrigger!.menuData = { item: task };

    // we open the menu
    this.matMenuTrigger!.openMenu();
  }

  openControllerSettings(id: string) {
    this.workflowComponent.openControllerSettings(id);
  }
}
