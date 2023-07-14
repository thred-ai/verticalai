import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Dict, LoadService } from '../load.service';
import { AIModelType } from '../models/workflow/ai-model-type.model';
import { Executable } from '../models/workflow/executable.model';
import { Key } from '../models/workflow/key.model';
import { Trigger } from '../models/workflow/trigger.model';
import { BranchedStep, Step } from 'sequential-workflow-designer';
import { WorkflowComponent } from '../workflow/workflow.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  workflow?: Executable;
  // openLayouts = ['g-comp', 'general', 'config'];

  //
  // flowModels: Dict<AIModelType> = {};

  apiKey?: Key;
  newAPIKey?: Key;
  mode: number = 1;

  loading = false;

  BranchedStep!: BranchedStep;

  // @Output() detailsChanged = new EventEmitter<Executable>();
  // @Output() iconChanged = new EventEmitter<File>();
  // @Output() apiKeyChanged = new EventEmitter<Key>();

  selectedFile?: Step;
  newImg?: File;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<SettingsComponent>,
    private loadService: LoadService
  ) {
    dialogRef.disableClose = true;
    this.apiKey = data.apiKey;
    this.selectedFile = data.step;
    this.workflow = data.workflow;

    this.mode = this.apiKey && this.selectedFile ? 1 : 2;
  }

  ngOnInit(): void {}

  saveAPIKey(id: string, data: string = '') {
    this.newAPIKey = new Key(id, data);
    // this.apiKeyChanged.emit(apiKey);
  }

  newBranch(step: BranchedStep) {
    const map1 = new Map();
    const map2 = new Map();

    Object.keys(step.branches).forEach((key, index) => {
      map1.set(key, step.branches[key]);
      map2.set(key, index);
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

    step.branches = Object.fromEntries(map1);
    step.properties['order'] = Object.fromEntries(map2);
  }

  changeBranchName(newName: string, step: BranchedStep, i: number) {
    const map1 = new Map();
    const map2 = new Map();

    Object.keys(step.branches).forEach((key, index) => {
      if (index == i) {
        map1.set(newName, step.branches[key]);
        map2.set(newName, index);
        return;
      }
      map1.set(key, step.branches[key]);
      map2.set(key, index);
    });

    step.branches = Object.fromEntries(map1);
    step.properties['order'] = Object.fromEntries(map2);
  }

  deleteBranch(step: BranchedStep, nameToRemove: string) {
    const map1 = new Map();
    const map2 = new Map();

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
      index += 1;
    });

    step.branches = Object.fromEntries(map1);
    step.properties['order'] = Object.fromEntries(map2);
  }

  isNameTaken(name: string, step: BranchedStep) {
    if (step.branches[name]) {
      return true;
    }
    return false;
  }

  async save() {
    this.loading = true;
    if (this.newAPIKey && this.workflow) {
      await this.loadService.saveAPIKeys(
        this.workflow.id,
        this.workflow.creatorId,
        this.newAPIKey
      );
    }
    this.loading = false;
    this.dialogRef.close({
      file: this.selectedFile,
      apiKey: this.newAPIKey,
      workflow: this.workflow,
      img: this.newImg,
    });
  }

  async fileChangeEvent(event: any, type = 1): Promise<void> {
    let file = event.target.files[0];

    let buffer = await file.arrayBuffer();

    var blob = new Blob([buffer]);

    var reader = new FileReader();
    reader.onload = (event: any) => {
      var base64 = event.target.result;

      let imgIcon = document.getElementById('imgIcon') as HTMLImageElement;
      imgIcon!.src = base64;

      // this.iconChanged.emit(file);
      this.newImg = file;
    };

    reader.readAsDataURL(blob);
  }
}
