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
import { BranchedStep, Step } from 'vertical-ai-designer';
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

    this.mode = this.selectedFile ? 1 : 2;
  }

  ngOnInit(): void {}

  saveAPIKey(id: string, data: string = '') {
    this.newAPIKey = new Key(id, data);
    // this.apiKeyChanged.emit(apiKey);
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
