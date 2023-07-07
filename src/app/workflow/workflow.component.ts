import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Dict, LoadService } from '../load.service';
import { Developer } from '../models/user/developer.model';
import { Workflow } from '../models/workflow/workflow.model';
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
} from 'sequential-workflow-designer';
import { ActivatedRoute, Router } from '@angular/router';
import { Agent } from '../models/workflow/agent.model';

import * as verticalkit from 'verticalkit/compiled';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
})
export class WorkflowComponent implements OnInit {
  loading = false;
  edited = false;
  newWorkflow = true;

  @Input() workflows?: Workflow[];

  models: Dict<AIModelType> = {};
  triggers: Dict<Trigger> = {};
  trainingData: Dict<TrainingData> = {};
  apiKeys: Dict<Key> = {};
  apiRequests: Dict<APIRequest> = {};

  workflowIcon?: File;
  newTrainingData?: TrainingData;
  newAPIKey?: Key;
  newAPIRequest?: APIRequest;

  workflow = new BehaviorSubject<Workflow | undefined>(undefined);
  theme: 'light' | 'dark' = 'light';
  mode = 'sidebar';

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
      await this.save();
    }
  }

  async handleWindowsKeyEvents($event: any) {
    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.ctrlKey && charCode === 's') {
      $event.preventDefault();
      // Action on Ctrl + S
      await this.save();
    }
  }

  set activeWorkflow(app: Workflow | undefined) {
    var workflow!: Workflow;

    if (app) {
      this.newWorkflow = false;
      workflow = app;
      workflow.layout = this.loadService.sortBranches(workflow.layout);
    } else {
      this.newWorkflow = true;
      workflow = new Workflow(
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
    //
    if (workflow.layout.sequence[0]?.type == 'trigger') {
      workflow.layout.sequence.splice(0, 1);
    }

    this.workflow.next(workflow);

    const loadData = () => {
      this.loadService.getTrainingData(workflow.id, workflow.creatorId);
      this.loadService.getAPIKeys(workflow.id, workflow.creatorId);
      this.loadService.getAPIs(workflow.id, workflow.creatorId);
    };

    if (this.newWorkflow) {
      this.loadService.currentUser.then((user) => {
        if (user?.uid && this.workflow) {
          workflow.creatorId = user.uid;
          this.workflow.next(workflow);
          loadData();
        }
      });
    } else {
      loadData();
    }
  }

  setWorkflow(id?: string) {
    this.workflow.next(undefined);

    this.cdr.detectChanges();

    setTimeout(() => {
      if (id) {
        let same = this.workflows?.find((w) => w.id == id);

        if (same) {
          this.activeWorkflow = same;
        }
      } else {
        this.activeWorkflow = undefined;
      }

      this.selectFile('main');
    }, 100);

    // if (val){
    //   val.utils?.push
    // }
  }

  items = new BehaviorSubject<TaskTree[] | undefined>(undefined);

  executable?: Executable;

  openFileId?: string;

  constructor(
    private loadService: LoadService,
    @Inject(PLATFORM_ID) private platformID: Object,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      let proj = params['project'];
      let file = params['file'];

      if (this.workflows) {
        if (!this.openFileId && this.workflow) {
          this.activeWorkflow =
            this.workflows?.find((f) => f.id == proj) ?? this.workflows[0];

          this.selectFile(file ?? 'main', this.activeWorkflow);

          this.loadService.loadedModels.subscribe((models) => {
            this.models = models;
          });

          this.loadService.theme.subscribe((theme) => {
            this.theme = theme;
          });

          this.loadService.loadedTriggers.subscribe((triggers) => {
            this.triggers = triggers;
          });

          this.loadService.loadedTrainingData.subscribe((data) => {
            this.trainingData = data;
          });

          this.loadService.loadedKeys.subscribe((data) => {
            this.apiKeys = data;
          });

          this.loadService.loadedRequests.subscribe((data) => {
            this.apiRequests = data;
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

  async initExecutable(w?: Workflow) {
    if (w) {
      this.items.next([
        new TaskTree(
          w.name,
          'app',
          'category',
          this.analyzeTasks(w.layout.sequence),
          new TaskTree('MainController', 'main', 'model', [], undefined, {
            type: 'model',
            metaType: 'main',
          }),
          { type: 'folder' }
        ),
      ]);
    }
    if (w && w.id && w.creatorId && w.creatorId != '') {
      try {
        if (w.executableUrl) {
          let exec = (await this.loadService.getExecutable(w.id)) as Executable;
          console.log(exec)
          this.executable = exec;
        } else {
          let exec = new Executable(w?.name ?? '', w?.id ?? '', {
            main: new Agent('main', 'main', null, null),
          });
          exec = this.fillExecutable(exec, this.items.value ?? []);

          this.executable = exec;
          this.checkSave();
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  checkSave() {
    if (this.workflow && this.workflow.value?.creatorId != '') {
      this.save();
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

  async save(mode = 1) {
    let workflow = this.workflow.value;
    console.log(mode);
    console.log(this.executable);
    console.log(this.openFileId);

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
        } else if (mode == 3 && this.newAPIKey) {
          await this.loadService.saveAPIKeys(
            workflow.id,
            workflow.creatorId,
            this.newAPIKey
          );
          this.edited = false;
          this.newAPIKey = undefined;

          this.updateWorkflows(workflow);
        } else if (
          mode == 1 &&
          this.executable &&
          this.openFileId &&
          this.items.value
        ) {
          console.log('saving');
          this.executable = this.fillExecutable(
            this.executable,
            this.items.value ?? []
          );

          workflow.executableUrl = await this.loadService.uploadExecutable(
            workflow.id,
            this.executable
          );

          console.log('SAVING WORKFLOW');
          await this.loadService.saveSmartUtil(workflow, (result) => {
            this.edited = false;
            console.log(workflow);
            console.log('SAVED!');
            this.updateWorkflows(workflow);
          });

          return;
        }
      } catch (error) {}
    } else {
      console.log('masuk');
    }
  }

  fillExecutable(
    executable: Executable,
    data: TaskTree[],
    items: TaskTree[] = this.flattenTree(data)
  ) {
    var exec = executable;
    items
      .filter((i) => i.type == 'model')
      .forEach((i) => {
        if (!exec.agents[i.id] || !exec.agents[i.id]?.source) {
          exec.agents[i.id] = new Agent(
            i.id,
            i.metadata['metaType'],
            this.defaultCode(i.metadata['metaType']) ?? null,
            ''
          );
        }
      });

    return exec;
  }

  removeWorkflow() {
    // let index = this.loadService.loadedUser.value?.utils.findIndex(
    //   (w) => w.id == this.workflow?.id
    // );
    // if (index != undefined && index > -1) {
    //   this.loadService.loadedUser.value?.utils.splice(index, 1);
    // }
  }

  flattenTree(items: TaskTree[]) {
    function getMembers(members: TaskTree[]): TaskTree[] {
      let sequence: TaskTree[] = [];
      const flattenMembers = members.map((m) => {
        if (m.sequence && m.sequence.length) {
          sequence = [...sequence, ...m.sequence];
        }
        if (
          m.metadata['type'] == 'switch' ||
          (m.metadata['type'] == 'folder' && m.categoryTask)
        ) {
          let categoryTask = [m.categoryTask] as TaskTree[];
          sequence = [...sequence, ...categoryTask];
        }
        return m;
      });

      return flattenMembers.concat(
        sequence.length ? getMembers(sequence) : sequence
      );
    }

    return getMembers(items);
  }

  openTestEditor() {}

  async publish(
    workflow = this.workflow.value,
    close = false,
    callback?: (result?: Workflow) => any
  ) {
    var w = workflow;
    if (w && this.executable) {
      this.loading = true;

      let exec = this.fillExecutable(this.executable, this.items.value ?? []);

      console.log('OLD EXEC');
      console.log(this.executable);

      console.log('NEW EXEC');
      console.log(exec);

      if (this.items.value) {
        // let flat = this.flattenTree(this.items.value);

        // await Promise.all(
        //   Object.keys(exec.agents).map(async (e) => {
        //     if (flat.find(f => f.id == e)){
        //       await this.loadService.saveCode(
        //         w!.creatorId,
        //         w!.id,
        //         exec.agents[e]
        //       );
        //     }
        //     else{
        //       await this.loadService.deleteCode(
        //         w!.creatorId,
        //         w!.id,
        //         exec.agents[e]
        //       );
        //       delete exec.agents[e]
        //     }
        //   })
        // );

        w.executableUrl = await this.loadService.uploadExecutable(w.id, exec);

        this.loadService.publishSmartUtil(w, (result) => {
          this.loading = false;
          if (callback) {
            callback(result);
            if (close && result) {
              this.close();
            }
          }
        });
      }
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
      this.activeWorkflow = workflow;
      let index = dev.utils.findIndex((w) => w.id == workflow.id);
      if (index > -1) {
        dev.utils[index] = workflow;
      } else {
        dev.utils.push(workflow);
      }
      this.loadService.loadedUser.next(dev);
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
              { type: 'folder' }
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
              { type: 'model', metaType: switchTask.type }
            ),
            { type: 'switch' }
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
              { type: 'container', metaType: loopTask.type }
            ),
            { type: 'folder' }
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
            { type: 'model', metaType: task.type }
          )
        );
      }
    });

    return objects;
  }

  setFieldName(name: string, id: string) {
    //fileName

    this.save();
  }

  selectFile(fileId: string, workflow = this.workflow.value) {
    if (workflow && fileId) {
      this.openFileId = fileId;
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

  jsFormattedName(name: string, same: number) {
    return (
      name
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
        .split('-')
        .join('') +
      'Controller' +
      (same > 1 ? `(${same})` : '')
    );
  }

  defaultCode(type: string) {
    let list = verticalkit.default.classList;

    switch (type) {
      case 'switch':
        return list.find((l) => l.name == 'switch')?.base ?? '';
      case 'container':
        return list.find((l) => l.name == 'container')?.base ?? '';
      case 'main':
        return (list.find((l) => l.name == 'generic')?.base ?? '').trim();
      default:
        return list.find((l) => l.name == 'generic')?.base ?? '';
    }
  }
}
