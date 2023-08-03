import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  BranchedStep,
  Definition,
  Designer,
  Step,
  StepEditorContext,
  StepsConfiguration,
  ToolboxConfiguration,
  ToolboxGroupConfiguration,
} from 'vertical-ai-designer';
import { DesignerComponent } from 'vertical-ai-designer-angular';
import { Dict, LoadService } from '../load.service';
import { Executable } from '../models/workflow/executable.model';
import { AIModelType } from '../models/workflow/ai-model-type.model';
import { Trigger } from '../models/workflow/trigger.model';
import { TrainingData } from '../models/workflow/training-data.model';
import { Clipboard } from '@angular/cdk/clipboard';
import { Key } from '../models/workflow/key.model';
import { APIRequest } from '../models/workflow/api-request.model';
import { ApiEditorComponent } from '../api-editor/api-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { WorkflowComponent } from '../workflow/workflow.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuTrigger } from '@angular/material/menu';
import { TaskTree } from '../models/workflow/task-tree.model';
import { SettingsComponent } from '../settings/settings.component';
import { DatabaseComponent } from '../database/database.component';

@Component({
  selector: 'verticalai-workflow-designer',
  templateUrl: './workflow-designer.component.html',
  styleUrls: ['./workflow-designer.component.scss'],
})
export class WorkflowDesignerComponent
  implements OnInit, AfterViewInit, AfterViewChecked
{
  designer?: Designer;

  public definitionJSON?: string;

  workflow?: Executable;

  BranchedStep!: BranchedStep;
  any!: any;

  @ViewChild('gridModeSwitch', { read: ElementRef }) element:
    | ElementRef
    | undefined;

  shouldRefresh = false;

  //
  @Input() models: Dict<AIModelType> = {};
  flowModels: Dict<AIModelType> = {};

  trainingTypes = [
    {
      name: 'Auto',
      id: 'auto',
    },
    {
      name: 'Manual',
      id: 'manual',
    },
    {
      name: 'None',
      id: 'none',
    },
  ];

  // @Input() apiRequests: Dict<APIRequest> = {};
  @Input() theme: 'light' | 'dark' = 'light';

  get pluginGroup(): ToolboxGroupConfiguration {
    return {
      name: 'Plugins',
      steps: [
        {
          componentType: 'task',
          name: 'Twilio',
          properties: {
            defaultName: 'Twilio',
          },
          type: 'twilio',
        },
      ],
    };
  }

  get flowGroup(): ToolboxGroupConfiguration {
    return {
      name: 'Vertical AI',
      steps: [
        {
          componentType: 'switch',
          name: 'Decision',
          properties: {
            defaultName: 'Decision',
            default: 'Option 1',
            order: {
              'Option 1': 0,
              'Option 2': 1,
            },
            branches: {
              'Option 1': { description: '' },
              'Option 2': { description: '' },
            },
          },
          type: 'switch',
          id: 'decision',
          branches: {
            'Option 1': [],
            'Option 2': [],
          },
        } as Step,
        {
          componentType: 'container',
          name: 'Group',
          properties: {
            defaultName: 'Group',
            frequency: 1,
          },
          type: 'container',
          id: 'loop',
          sequence: [],
        } as Step,
        // {
        //   componentType: 'task',
        //   name: 'Break',
        //   properties: {
        //     defaultName: 'Break',
        //     type: 'break',
        //   },
        //   type: 'break',
        //   id: 'break',
        //   sequence: [],
        // } as Step,
      ],
    };
  }

  get taskGroup(): ToolboxGroupConfiguration {
    return {
      name: 'Tasks',
      steps: [
        {
          componentType: 'task',
          name: 'Custom Agent',
          properties: {
            defaultName: 'Custom Agent',
            type: 'api',
          },
          type: 'api',
          id: 'api',
          sequence: [],
        } as Step,
        {
          componentType: 'task',
          name: 'Web Agent',
          properties: {
            defaultName: 'Web Agent',
            type: 'web',
          },
          type: 'web',
          id: 'web',
          sequence: [],
        } as Step,
        {
          componentType: 'task',
          name: 'Script Agent',
          properties: {
            defaultName: 'Script Agent',
            type: 'js',
          },
          type: 'js',
          id: 'js',
          sequence: [],
        } as Step,
      ],
    };
  }

  @Output() detailsChanged = new EventEmitter<Executable>();
  @Output() iconChanged = new EventEmitter<File>();
  @Output() trainingDataChanged = new EventEmitter<TrainingData>();
  @Output() apiKeyChanged = new EventEmitter<Key>();
  // @Output() apiRequestChanged = new EventEmitter<APIRequest>();
  @Output() selectedFileChanged = new EventEmitter<string>();

  selectedFile?: Step;

  constructor(
    private cdr: ChangeDetectorRef,
    private clipboard: Clipboard,
    private dialog: MatDialog,
    private renderer: Renderer2,
    private loadService: LoadService,
    private workflowComponent: WorkflowComponent,
    private _snackBar: MatSnackBar
  ) {}

  @ViewChildren('geditor') divs?: QueryList<ElementRef>;

  ngAfterViewChecked(): void {}

  copy(text: string) {
    this.clipboard.copy(text);
  }

  openAPIEditor(api: APIRequest, step: Step) {
    // let editor = this.dialog.open(ApiEditorComponent, {
    //   height: 'calc(var(--vh, 1vh) * 70)',
    //   width: 'calc(var(--vh, 1vh) * 70)',
    //   maxWidth: '100vw',
    //   panelClass: 'app-full-bleed-dialog',
    //   data: {
    //     api,
    //   },
    // });
    // editor.afterClosed().subscribe((value) => {
    //   if (value && value != '') {
    //     let api = value as APIRequest;
    //     this.apiRequestChanged.emit(api);
    //     setTimeout(() => {
    //       this.refreshStepEditor(step);
    //     }, 500);
    //   }
    // });
  }

  saveAPIKey(id: string, data: string = '') {
    let apiKey = new Key(id, data);
    this.apiKeyChanged.emit(apiKey);
  }

  ngAfterViewInit(): void {
    let title = document.getElementsByClassName('sqd-toolbox-header-title')[0];

    if (title) {
      title.innerHTML = 'Controllers';
    }

    // this.setAPISVG();
    this.setIcon();
  }

  setIcon() {
    if (this.element) {
      const targetSpan: HTMLElement = this.element.nativeElement.querySelector(
        '.mat-slide-toggle-thumb'
      );
      while (targetSpan.firstChild) {
        targetSpan.firstChild.remove();
      }
      const elem = this.renderer.createElement('mat-icon');
      const icon = this.showingGrid ? 'grid_on' : 'grid_off';
      elem.setAttribute(
        'class',
        'mat-icon notranslate material-icons mat-icon-no-color light-mode-switch-icon rounded-circle'
      );
      elem.textContent = icon;
      targetSpan.appendChild(elem);
    }
  }

  @ViewChild('sqdDesigner') public sqdDesigner?: DesignerComponent;

  public toolboxConfiguration: ToolboxConfiguration = {
    groups: [],
  };

  setToolbarLoc() {
    setTimeout(() => {
      var content = document.getElementsByClassName(
        'sqd-scrollbox'
      )[0] as HTMLDivElement;
      var parent = document.getElementById('toolbar-nav') as HTMLDivElement;

      if (content && parent) {
        // let newElem = content.cloneNode(true);
        parent.firstChild?.remove();
        parent.appendChild(content);

        window.dispatchEvent(new Event('resize'));
      }
    }, 0);
  }

  resize() {
    window.dispatchEvent(new Event('resize'));
  }

  showingGrid = true;

  set showGrid(value: boolean) {
    this.showingGrid = value;
    this.setIcon();
    if (value) {
      document.documentElement.style.setProperty(
        '--gridColor',
        this.loadService.themes[this.theme].gridColor
      );
    } else {
      document.documentElement.style.setProperty('--gridColor', `transparent`);
    }
  }

  // changeTriggerType(newType: string, context: GlobalEditorContext) {
  //   this.workflow!.layout.properties['trigger'] = newType;

  //   context.notifyPropertiesChanged();
  // }

  definitionChanged(definition: Definition) {
    this.workflow!.layout = definition;
    this.setAPISVG();
    this.saveLayout();
  }

  public readonly stepsConfiguration: StepsConfiguration = {
    iconUrlProvider: (componentType: string, type: string) => {
      return this.loadService.iconUrlForController(componentType, type);
    },
    canMoveStep: (sourceSequence, step, targetSequence, targetIndex) => {
      return true;
    },
    canInsertStep: (step, targetSequence, targetIndex) => {
      return true;
    },
    canDeleteStep: (step, parentSequence) => {
      return this.loadService.confirmDelete();
    },
    isDeletable: (step, parentSequence) => {
      // let ref = this._snackBar.open('Delete Controller', 'Delete');
      // ref.onAction().subscribe(() => {
      //   return true
      // });

      // ref.afterDismissed().subscribe(() => {
      //   return false
      // });

      return true;
    },
    isDraggable: (step, parentSequence) => {
      return true;
    },
  };

  isNameTaken(name: string, step: BranchedStep) {
    if (step.branches[name]) {
      return true;
    }
    return false;
  }

  done = false;

  openPathSettings() {}

  public ngOnInit() {
    this.shouldRefresh = true;
    this.workflowComponent.workflow.subscribe((w) => {
      if (w && this.shouldRefresh) {
        this.workflow = undefined;
        this.designer = undefined;

        this.cdr.detectChanges();

        this.workflow = w;

        this.rerenderDesigner();

        this.shouldRefresh = false;
      }
    });

    this.loadService.database.subscribe(d => {
      if (d){
        this.loadedDocs = Object.keys(d)
      }
    })

    this.done = true;

    if (this.toolboxConfiguration.groups.length == 0) {
      let modelGroups: ToolboxGroupConfiguration[] = Object.values(
        this.models
      ).map((modelType) => {
        return {
          name: `${modelType.name}`,
          steps: Object.values(modelType.models).map((model) => {
            return {
              componentType: 'task',
              name: model.name,
              properties: {
                defaultName: model.name,
                type: 'model',
              },
              type: model.id,
            };
          }),
        };
      });

      let gpt = this.models['LLM'].models['gpt-LLM'];

      if (gpt) {
        this.flowModels['FLOW'] = new AIModelType('Flow', 'FLOW', {
          switch: gpt,
        });
      }

      this.toolboxConfiguration.groups = modelGroups.concat([
        this.flowGroup,
        // this.taskGroup,
      ]);

      var elementResizeDetectorMaker = require('element-resize-detector');

      var erd = elementResizeDetectorMaker();

      // // With the ultra fast scroll-based approach.
      // // This is the recommended strategy.
      // var erdUltraFast = elementResizeDetectorMaker({
      //   strategy: "scroll" //<- For ultra performance.
      // });

      this.setToolbarLoc();

      // erd.listenTo(
      //   document.getElementById('container'),
      //   (element: HTMLElement) => {
      //     var width = element.offsetWidth;
      //     var height = element.offsetHeight;
      //     window.dispatchEvent(new Event('resize'));
      //   }
      // );

      this.workflowComponent.openStep.subscribe((step) => {
        if (step) {
          this.selectedFile = step;
        }
        this.rerenderDesigner();
      });
    }
  }

  rerenderDesigner() {
    window.dispatchEvent(new Event('resize'));
    this.setToolbarLoc();
    this.cdr.detectChanges();
  }

  public onDesignerReady(designer: Designer) {
    this.designer = designer;

    this.rerenderDesigner();

    if (document.eventListeners) {
      let l = document.eventListeners('keyup')[0];
      document.removeEventListener('keyup', l);
    }

    // window.addEventListener(
    //   'keypress',
    //   function (event) {
    //     event.stopImmediatePropagation();
    //   },
    //   true
    // );

    // this.setToolbarLoc()

    try {
      this.designer?.onSelectedStepIdChanged.subscribe((id) => {
        setTimeout(() => {
          if (id) {
            this.selectedFileChanged.emit(id);
            // clearListener(id)
          } else {
            this.selectedFileChanged.emit('main');
          }
        }, 1);

        this.rerenderDesigner();
      });

      this.workflowComponent.openStep.subscribe((step) => {
        this.stepContext = undefined;
        if (step) {
          if (step.id != 'main') {
            this.designer?.selectStepById(step.id);
            this.downloadDB();
          } else {
            this.designer?.clearSelectedStep();
          }
          this.rerenderDesigner();
        }
      });
    } catch (error) {}

    // async function clearListener(id: string) {
    //   let doc = document.getElementsByClassName('sqd-selected')[0];

    //   if (doc) {
    //     doc.outerHTML = doc.outerHTML
    //   }
    // }
  }

  loadedDocs: string[] = []

  downloadDB() {
    if (
      this.workflow &&
      this.selectedFile &&
      (this.selectedFile.properties['training'] ?? 'auto') == 'auto'
    ) {
      if (this.selectedFile && !this.selectedFile.properties['autoId'] && this.loadedDocs[0]){
        console.log(this.loadedDocs[0])
        this.selectedFile.properties['autoId'] = this.loadedDocs[0]
        this.selectedFileChanged.emit(this.selectedFile.id)
        this.saveLayout()
      }
    }
  }

  stepContext?: StepEditorContext;

  logEvent(event: any) {
    console.log('hey');
    console.log(event);
  }

  public saveLayout() {
    // this.definition = definition;

    // if (this.)
    this.detailsChanged.emit(this.workflow);
  }

  public updateName(step: Step, event: Event, context: StepEditorContext) {
    step.name = (event.target as HTMLInputElement).value;
    context.notifyNameChanged();
  }


  onInput(ev: any) {
    var value = ev.target!.value;

    // if (value == '') {
    //   value = this.defaultValue;
    // }

    return value;
  }

  private updateDefinitionJSON() {
    this.definitionJSON = JSON.stringify(this.workflow?.layout, null, 2);
  }

  // @ViewChild('imgIcon') imgIcon?: ElementRef<HTMLImageElement>;

  async fileChangeEvent(event: any, type = 1): Promise<void> {
    let file = event.target.files[0];

    let buffer = await file.arrayBuffer();

    var blob = new Blob([buffer]);

    var reader = new FileReader();
    reader.onload = (event: any) => {
      var base64 = event.target.result;

      let imgIcon = document.getElementById('imgIcon') as HTMLImageElement;
      imgIcon!.src = base64;

      this.iconChanged.emit(file);
    };

    reader.readAsDataURL(blob);
  }

  setAPISVG() {
    // setTimeout(() => {
    //   let elem = document.getElementsByClassName(
    //     'sqd-root-start-stop-icon'
    //   )[0] as SVGPathElement;
    //   if (elem) {
    //     console.log('ELEM');
    //     let elem2 = elem.parentNode as SVGGElement;
    //     if (elem2) {
    //       elem?.setAttribute(
    //         'd',
    //         'M 28.945312 -0.140625 C 13.019531 -0.140625 0.117188 12.746094 0.117188 28.660156 L 0.117188 259.058594 C 0.117188 274.972656 13.019531 287.859375 28.945312 287.859375 L 346.054688 287.859375 C 361.980469 287.859375 374.882812 274.972656 374.882812 259.058594 L 374.882812 28.660156 C 374.882812 12.746094 361.980469 -0.140625 346.054688 -0.140625 Z M 75.820312 86.257812 L 111.714844 86.257812 L 150.480469 201.460938 L 118.527344 201.460938 L 111.320312 176.148438 L 73.679688 176.148438 L 66.246094 201.460938 L 37.136719 201.460938 Z M 173.085938 86.257812 L 223.589844 86.257812 C 248.371094 86.257812 265.144531 102.398438 265.144531 127.152344 C 265.144531 151.660156 247.488281 167.679688 221.847656 167.679688 L 202.394531 167.679688 L 202.394531 201.460938 L 173.085938 201.460938 Z M 302.8125 86.257812 L 332.121094 86.257812 L 332.121094 201.460938 L 302.8125 201.460938 Z M 202.421875 108.757812 L 202.421875 145.574219 L 215.679688 145.574219 C 228.148438 145.574219 235.5 139.175781 235.5 127.210938 C 235.484375 115.070312 228.230469 108.757812 215.847656 108.757812 Z M 91.894531 112.21875 L 79.253906 155.082031 L 105.800781 155.082031 L 93.414062 112.21875 Z M 91.894531 112.21875'
    //       );
    //       elem?.setAttribute('transform', 'scale(0.04583333333333333)');
    //       elem2?.setAttribute('transform', 'translate(6, 9)');
    //     }
    //   }
    // let elems = document.getElementsByClassName(
    //   'sqd-root-start-stop-icon'
    // )[1] as SVGPathElement;
    // if (elems) {
    //   console.log('ELEM');
    //   let elem2 = elems.parentNode as SVGGElement;
    //   if (elem2) {
    //     elems?.setAttribute(
    //       'd',
    //       'M 283.265625 59.023438 L 260.585938 36.375 L 158.972656 137.941406 L 181.648438 160.589844 Z M 351.300781 36.375 L 181.570312 205.8125 L 114.734375 139.0625 L 92.054688 161.710938 L 181.570312 251.113281 L 373.902344 59.023438 Z M 1.417969 161.710938 L 90.933594 251.113281 L 113.613281 228.464844 L 24.097656 139.0625 Z M 1.417969 161.710938'
    //     );
    //     elems?.setAttribute('transform', 'scale(0.04583333333333333)');
    //     elem2?.setAttribute('transform', 'translate(6, 9)');
    //   }
    // }
    // }, 1);
  }

  newBranch(step: BranchedStep) {
    const map1 = new Map();
    const map2 = new Map();
    const map3 = new Map();

    Object.keys(step.branches).forEach((key, index) => {
      map1.set(key, step.branches[key]);
      map2.set(key, index);
      map3.set(key, (step.properties['branches'] as Dict<any>)[key]);
    });

    let name = `Option ${(Object.keys(step.branches) as string[]).length + 1}`;

    if (this.isNameTaken(name, step)) {
      var index = 1;
      do {
        index += 1;
        name = `Option ${
          (Object.keys(step.branches) as string[]).length + index
        }`;
      } while (this.isNameTaken(name, step));
    }
    map1.set(name, []);
    map2.set(name, map1.size - 1);
    map3.set(name, (step.properties['branches'] as Dict<any>)[name]);

    step.branches = Object.fromEntries(map1);
    step.properties['order'] = Object.fromEntries(map2);
    step.properties['branches'] = Object.fromEntries(map3);

    this.shouldRefresh = true;

    this.saveLayout();
  }

  setBranchDescription(
    branchName: string,
    step: BranchedStep,
    description: string
  ) {
    if (!step.properties['branches']) {
      step.properties['branches'] = {};
    }

    let branches = step.properties['branches'] as Dict<any>;

    branches[branchName] = {
      description,
    };
  }

  openBranchSettings(step: BranchedStep, branch?: string) {
    let ref = this.dialog.open(SettingsComponent, {
      width: 'calc(var(--vh, 1vh) * 70)',
      maxWidth: '650px',
      maxHeight: 'calc(var(--vh, 1vh) * 100)',
      panelClass: 'app-full-bleed-dialog',

      data: {
        step,
        branch,
        workflow: this.workflow,
      },
    });

    ref.afterClosed().subscribe(async (val) => {
      if (val && val != '' && val != '0') {
        let description = val.description ?? '';
        let title = val.title ?? '';

        this.setBranchName(title, step, branch);

        this.setBranchDescription(title, step, description);

        this.shouldRefresh = true;

        this.saveLayout();
      }
    });
  }

  placeholders: Dict<any> = {
    'gpt-LLM': 'ex. Keep answers short',
    switch: 'ex. Choose "Option 1" if the sentiment is happy',
    'dalle-TIM': 'ex. High Definition, Hyper-Realistic',
  };

  setBranchName(newName: string, step: BranchedStep, oldName: string = '') {
    const map1 = new Map();
    const map2 = new Map();
    const map3 = new Map();

    let branches = Object.keys(step.branches);
    let i = branches.indexOf(oldName);

    if (i > -1) {
      branches.forEach((key, index) => {
        var name = key;
        if (index == i) {
          name = newName;
          if (step.properties['default'] == oldName) {
            step.properties['default'] = name;
          }
        }
        map1.set(name, step.branches[key]);
        map2.set(name, index);
        map3.set(name, (step.properties['branches'] as Dict<any>)[key]);
      });

      step.branches = Object.fromEntries(map1);
      step.properties['order'] = Object.fromEntries(map2);
      step.properties['branches'] = Object.fromEntries(map3);
    }
  }

  deleteBranch(step: BranchedStep, nameToRemove: string) {
    const map1 = new Map();
    const map2 = new Map();
    const map3 = new Map();

    let branches = Object.keys(step.branches);

    if (branches.length == 2) {
      return;
    }
    branches.forEach((key, index) => {
      if (key != nameToRemove) {
        map1.set(key, step.branches[key]);
      }
    });

    var index = 0;
    map1.forEach((m: any, key: string) => {
      map2.set(key, index);
      map3.set(key, (step.properties['branches'] as Dict<any>)[key]);
      index += 1;
    });

    step.branches = Object.fromEntries(map1);
    step.properties['order'] = Object.fromEntries(map2);
    step.properties['branches'] = Object.fromEntries(map3);

    if (step.properties['default'] == nameToRemove) {
      step.properties['default'] = Object.keys(
        step.properties['order'] ?? {}
      )[0] as string;
    }

    this.shouldRefresh = true;

    this.saveLayout();
  }

  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger?: MatMenuTrigger;
  menuTopLeftPosition = { x: '0', y: '0' };

  onRightClick(event: MouseEvent, branch: string, step: BranchedStep) {
    // preventDefault avoids to show the visualization of the right-click menu of the browser
    event.preventDefault();
    event.stopPropagation();

    // we record the mouse position in our object
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';

    // we open the menu
    // we pass to the menu the information about our object
    this.matMenuTrigger!.menuData = { item: branch, step };

    // we open the menu
    this.matMenuTrigger!.openMenu();
  }
}
