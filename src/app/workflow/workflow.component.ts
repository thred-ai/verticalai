import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Dict, LoadService } from '../load.service';
import { Developer } from '../models/user/developer.model';
import { AIModel } from '../models/workflow/ai-model.model';
import { AIModelType } from '../models/workflow/ai-model-type.model';
import { Trigger } from '../models/workflow/trigger.model';
import { TrainingData } from '../models/workflow/training-data.model';
import { Key } from '../models/workflow/key.model';
import { APIRequest } from '../models/workflow/api-request.model';
import { ApiTesterComponent } from '../api-tester/api-tester.component';
import { BehaviorSubject } from 'rxjs';
import { Executable } from '../models/workflow/executable.model';
import { TaskTree } from '../models/workflow/task-tree.model';
import {
  Sequence,
  BranchedStep,
  SequentialStep,
  Step,
} from 'sequential-workflow-designer';
import { ActivatedRoute, Router } from '@angular/router';
import { Agent } from '../models/workflow/agent.model';

import * as verticalkit from 'verticalkit/compiled';
import { HttpClient } from '@angular/common/http';
import { SettingsComponent } from '../settings/settings.component';
import { WorkflowDesignerComponent } from '../workflow-designer/workflow-designer.component';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
})
export class WorkflowComponent implements OnInit {
  loading = false;
  edited = false;
  newWorkflow = true;

  @Input() workflows?: Executable[];

  models: Dict<AIModelType> = {};
  triggers: Dict<Trigger> = {};
  trainingData: Dict<TrainingData> = {};
  apiKeys: Dict<Key> = {};
  apiRequests: Dict<APIRequest> = {};

  workflowIcon?: File;
  newTrainingData?: TrainingData;
  newAPIRequest?: APIRequest;

  workflow = new BehaviorSubject<Executable | undefined>(undefined);

  theme: 'light' | 'dark' = 'light';

  mode = 'sidebar';

  selectedIcon: string = 'schema';

  onKeyDown($event: any): void {
    // Detect platform
    if (navigator.platform.match('Mac')) {
      this.handleMacKeyEvents($event);
    } else {
      this.handleWindowsKeyEvents($event);
    }
  }

  async handleMacKeyEvents($event: any) {
    // MetaKey documentation
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey
    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.metaKey && charCode === 's') {
      $event.preventDefault();
      // Action on Cmd + S
      await this.save(1, true);
    }
  }

  async handleWindowsKeyEvents($event: any) {
    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.ctrlKey && charCode === 's') {
      $event.preventDefault();
      // Action on Ctrl + S
      await this.save(1, true);
    }
  }

  set activeWorkflow(app: Executable | undefined) {
    var workflow!: Executable;

    if (app) {
      this.newWorkflow = false;
      workflow = app;
      workflow.layout = this.loadService.sortBranches(workflow.layout);
    } else {
      this.newWorkflow = true;
      workflow = new Executable(
        this.loadService.newUtilID,
        '',
        new Date().getTime(),
        0,
        '',
        'https://storage.googleapis.com/thred-protocol.appspot.com/resources/default_smartutil_app.png'
      );
    }

    if (!workflow.layout.properties['trigger']) {
      workflow.layout.properties['trigger'] = 'api';
    }

    if (!workflow.layout.properties['mainSource']) {
      workflow.layout.properties['mainSource'] = this.defaultCode('main');
    }

    //
    if (workflow.layout.sequence[0]?.type == 'trigger') {
      workflow.layout.sequence.splice(0, 1);
    }

    this.workflow.next(workflow);

    const loadData = () => {
      this.loadService.getAPIKeys(workflow.id, workflow.creatorId);
    };

    if (this.newWorkflow) {
      this.loadService.currentUser.then((user) => {
        if (user?.uid && this.workflow) {
          workflow.creatorId = user.uid;
          this.workflow.next(workflow);
          this.checkSave();
          loadData();
        }
      });
    } else {
      loadData();
    }
  }

  setWorkflow(id?: string, fileId = 'main') {
    this.workflow.next(undefined);

    this.cdr.detectChanges();

    setTimeout(() => {
      if (id) {
        let same = this.workflows?.find((w) => w.id == id);

        if (same) {
          this.activeWorkflow = same;
          // same.layout.properties
          this.selectFile(fileId);
        }
      } else {
        this.activeWorkflow = undefined;
      }
    }, 100);

    // if (val){
    //   val.utils?.push
    // }
  }

  items = new BehaviorSubject<TaskTree[] | undefined>(undefined);

  openStep = new BehaviorSubject<Step | undefined>(undefined);

  classes: Dict<any> = {};

  constructor(
    private loadService: LoadService,
    @Inject(PLATFORM_ID) private platformID: Object,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await Promise.all(
      verticalkit.controllers.map(async (controller) => {
        let path = controller.path;
        let name = controller.name;
        let id = controller.id;

        let text = await new Promise((resolve, reject) => {
          try {
            this.httpClient
              .get(`src/assets/verticalkit/src/${path}.ts`, {
                responseType: 'text',
              })
              .subscribe((data) => resolve(data));
          } catch (error) {
            reject(error);
          }
        });

        this.classes[id] = { name, path, id, text };
      })
    );

    this.route.queryParams.subscribe((params) => {
      let proj = params['project'];
      let file = params['file'];

      if (this.workflows) {
        if (!this.openStep.value && this.workflow) {
          this.activeWorkflow =
            this.workflows?.find((f) => f.id == proj) ?? this.workflows[0];

          this.selectFile(file ?? 'main', this.activeWorkflow, false);

          if (!this.openStep.value) {
            this.selectFile('main', this.activeWorkflow, true);
          }

          this.loadService.loadedModels.subscribe((models) => {
            this.models = models;
          });

          this.loadService.theme.subscribe((theme) => {
            this.theme = theme;
          });

          this.loadService.loadedTriggers.subscribe((triggers) => {
            this.triggers = triggers;
          });

          this.loadService.loadedKeys.subscribe((data) => {
            this.apiKeys = data;
          });

          this.loadService.loading.subscribe((l) => {
            this.loading = l;
          });

          this.workflow.subscribe(async (w) => {
            this.initExecutable(w);
          });
        }
      }
    });
  }

  async initExecutable(w?: Executable, fetchExecutable = true) {
    if (w) {
      this.items.next([
        new TaskTree(
          w.name,
          'app',
          'category',
          this.analyzeTasks(w.layout.sequence),
          new TaskTree(w.name, 'main', 'model', [], undefined, {
            type: 'model',
            metaType: 'main',
            img: w.displayUrl,
          }),
          { type: 'folder', img: w.displayUrl }
        ),
      ]);
    }
  }

  checkSave() {
    if (this.workflow && this.workflow.value?.creatorId != '') {
      this.save(1, true);
    }
  }

  close() {}

  get isValid(): boolean {
    if (this.workflow.value) {
      let textFields = ['name'] as 'name'[];

      let validText =
        textFields.filter(
          (field) =>
            this.workflow.value![field] == undefined ||
            this.workflow.value![field] == null ||
            this.workflow.value![field]?.trim() == ''
        ).length == 0;

      // let validArray =
      //   arrayFields.filter(
      //     (field) =>
      //       this.workflow![field] == undefined || this.workflow![field] == null
      //   ).length == 0;

      return validText; //&& validArray;
    }

    return false;
  }

  async save(mode = 1, update = false) {
    let workflow = this.workflow.value;

    if (workflow && this.isValid) {
      try {
        if (mode == 0 && this.workflowIcon) {
          await this.loadService.uploadImg(
            this.workflowIcon,
            workflow.id,
            workflow.creatorId
          );
          this.edited = false;
          this.workflowIcon = undefined;

          this.updateWorkflows(workflow);
        } else if (mode == 1 && this.openStep.value && this.items.value) {
          let exec = await this.fillExecutable(workflow);

          let result = await this.loadService.saveSmartUtil(exec);

          if (result) {
            this.edited = false;
            if (update) {
              this.updateWorkflows(result);
            }
          }
          return;
        }
      } catch (error) {}
    } else {
      console.log('masuk');
    }
  }

  async fillExecutable(executable: Executable) {
    var exec = executable;

    await Promise.all(
      exec.layout.sequence.map(async (step) => {
        let s = this.findStep(step.id, exec.layout.sequence);
        if (s) {
          let source = s.properties['source'] as string;
          if (source == 'None' || source == null || source == undefined) {
            s.properties['source'] = this.defaultCode(s.type);
          }
        }
      })
    );

    return exec;
  }

  openControllerSettings(controllerId: string = 'main') {
    if (controllerId != 'main') {
      let ref = this.dialog.open(SettingsComponent, {
        width: 'calc(var(--vh, 1vh) * 70)',
        maxWidth: '650px',
        maxHeight: 'calc(var(--vh, 1vh) * 100)',
        panelClass: 'app-full-bleed-dialog',

        data: {
          apiKey: this.apiKeys[controllerId],
          step: this.findStep(
            controllerId,
            this.workflow.value?.layout.sequence ?? []
          ),
          workflow: this.workflow.value,
        },
      });

      ref.afterClosed().subscribe(async (val) => {
        if (val && val != '' && val != '0') {
          await this.save();

          this.setWorkflow(this.workflow.value!.id, controllerId);
        }
      });
    }
  }

  @ViewChild(WorkflowDesignerComponent) designer?: WorkflowDesignerComponent;

  removeWorkflow() {
    // let index = this.loadService.loadedUser.value?.utils.findIndex(
    //   (w) => w.id == this.workflow?.id
    // );
    // if (index != undefined && index > -1) {
    //   this.loadService.loadedUser.value?.utils.splice(index, 1);
    // }
  }

  openTestEditor() {}

  async publish(
    workflow = this.workflow.value,
    close = false,
    callback?: (result?: Executable) => any
  ) {
    var w = workflow;
    if (w) {
      this.loading = true;

      await this.save(1, false);
      w.executableUrl = await this.loadService.uploadExecutable(w.id, w);

      this.loadService.publishSmartUtil(w, (result) => {
        this.loading = false;
        if (callback) {
          callback(result);
          if (close && result) {
            this.close();
          }
        }
      });
    } else {
      if (callback) {
        callback();
      }
    }
  }

  saves: number[] = [];
  changes: number[] = [];

  loadingMode = 0;
  loadingChangeMode = 0;

  layoutSaved(data: { time: number; layout?: any }) {
    if (data.time) {
      if (data.layout) {
        let i = this.saves.indexOf(data.time);
        if (i > -1) {
          this.saves.splice(i, 1);
        }
        if (this.workflow.value) {
          this.workflow.value.layout = data.layout;

          this.updateWorkflows();

          this.cdr.detectChanges();
          //toast
          if (this.saves.length == 0) {
            this.loadingMode = 0;
          }
        }
      } else {
        this.loadingMode = 1;
        this.saves.push(data.time);
      }
    }
  }

  updateWorkflows(workflow = this.workflow.value) {
    let dev = JSON.parse(
      JSON.stringify(this.loadService.loadedUser.value)
    ) as Developer;

    if (dev && dev.utils && workflow) {
      // this.activeWorkflow = workflow;
      // let index = dev.utils.findIndex((w) => w.id == workflow.id);
      // if (index > -1) {
      //   dev.utils[index] = workflow;
      // } else {
      //   dev.utils.push(workflow);
      // }
      // this.loadService.loadedUser.next(dev);
      this.cdr.detectChanges();
    }
  }

  async changeLayout(data: { time: number; layout?: any; mode: number }) {
    if (data.time) {
      if (data.layout) {
        let i = this.changes.indexOf(data.time);
        if (i > -1) {
          this.changes.splice(i, 1);
        }
        if (this.workflow.value) {
          // this.workflow..layout = data.layout;
          this.cdr.detectChanges();
          //toast
          this.edited = true;

          if (this.changes.length == 0) {
            this.loadingChangeMode = 0;
          }
        }
      } else {
        // this.loadingChangeMode = data.mode;
        this.changes.push(data.time);
      }
    }
  }

  analyzeTasks(tasks: Sequence) {
    var objects: TaskTree[] = [];

    var sameNames: Dict<number> = {};

    tasks.forEach((task) => {
      let id = task.id;
      let stepName = task.name;

      sameNames[stepName] = (sameNames[stepName] ?? 0) + 1;

      if (task.componentType == 'switch') {
        let switchTask = task as BranchedStep;
        var branches: TaskTree[] = [];
        Object.keys(switchTask.branches).forEach((name) => {
          let sequence = switchTask.branches[name];
          branches.push(
            new TaskTree(
              name,
              id,
              'category',
              this.analyzeTasks(sequence),
              undefined,
              { type: 'folder', img: 'assets/switch.png' }
            )
          );
        });

        objects.push(
          new TaskTree(
            stepName,
            id,
            'category',
            branches,
            new TaskTree(
              (switchTask.properties['fileName'] as string) ??
                this.jsFormattedName(
                  switchTask.name,
                  sameNames[switchTask.name]
                ),
              switchTask.id + '',
              'model',
              [],
              undefined,
              { type: 'model', metaType: switchTask.type, img: 'assets/switch.png' }
            ),
            { type: 'switch', img: 'assets/switch.png' }
          )
        );
      } else if (task.componentType == 'container') {
        let loopTask = task as SequentialStep;
        objects.push(
          new TaskTree(
            stepName,
            id,
            'category',
            this.analyzeTasks(loopTask.sequence),
            new TaskTree(
              (loopTask.properties['fileName'] as string) ??
                this.jsFormattedName(loopTask.name, sameNames[loopTask.name]),
              loopTask.id,
              'model',
              [],
              undefined,
              { type: 'container', metaType: loopTask.type, img: 'assets/container.png' }
            ),
            { type: 'folder', img: 'assets/container.png' }
          )
        );
      } else {
        objects.push(
          new TaskTree(
            (task.properties['fileName'] as string) ??
              this.jsFormattedName(stepName, sameNames[task.name]),
            id,
            'model',
            [],
            undefined,
            {
              type: 'model',
              metaType: task.type,
              img: this.loadService.iconUrlForController(
                task.componentType,
                task.type
              ),
            }
          )
        );
      }
    });

    return objects;
  }

  setFieldName(name: string, id: string) {
    //fileName

    this.save(1, true);
  }

  selectFile(
    fileId: string | undefined,
    workflow = this.workflow.value,
    update = true
  ) {
    if (workflow && fileId) {
      this.openStep.next(this.findStep(fileId, workflow.layout.sequence));

      if (update) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            project: workflow.id,
            file: fileId,
          },
          queryParamsHandling: 'merge',
          // preserve the existing query params in the route
          skipLocationChange: false,
          // do not trigger navigation
        });
      }
    }
  }

  findStep(id: string, tasks: Sequence) {
    var stepToReturn: Step | undefined;

    if (id == 'main') {
      stepToReturn = {
        id: 'main',
        componentType: 'task',
        type: 'main',
        name: 'Main',
        properties: {},
      };

      return stepToReturn;
    }

    tasks.forEach((task) => {
      if (task.id == id) {
        stepToReturn = task;
      } else {
        if (task.componentType == 'switch') {
          let branchTask = task as BranchedStep;

          Object.values(branchTask.branches).forEach((b) => {
            let path = this.findStep(id, b);
            if (path) {
              stepToReturn = path;
            }
          });
        } else if (task.componentType == 'container') {
          let loopTask = task as SequentialStep;
          let path = this.findStep(id, loopTask.sequence);

          if (path) {
            stepToReturn = path;
          }
        }
      }
    });

    return stepToReturn;
  }

  jsFormattedName(name: string, same: number) {
    return (
      name
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
        .split('-')
        .join('') + (same > 1 ? `(${same})` : '')
    );
  }

  defaultCode(type: string) {
    switch (type) {
      case 'switch':
        return this.classes['branch'].text;
      case 'container':
        return this.classes['repeat'].text;
      case 'gpt-LLM':
        return this.classes['gpt'].text;
      case 'gpt3-LLM':
        return this.classes['gpt3'].text;
      case 'dalle-TIM':
        return this.classes['dalle'].text;
      case 'sd-TIM':
        return this.classes['sd'].text;
      case 'main':
        return this.classes['main'].text;

      default:
        return this.classes['default'].text;
    }
  }
}
