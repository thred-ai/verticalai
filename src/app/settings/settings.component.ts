import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { Dict, LoadService } from '../load.service';
import { Executable } from '../models/workflow/executable.model';
import { Key } from '../models/workflow/key.model';
import { Step } from 'vertical-ai-designer';
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
  newBranch: Dict<any> = {};

  mode: number = 1;

  loading = false;

  // @Output() detailsChanged = new EventEmitter<Executable>();
  // @Output() iconChanged = new EventEmitter<File>();
  // @Output() apiKeyChanged = new EventEmitter<Key>();

  selectedFile?: Step;
  newImg?: File;

  any!: any;

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
    this.newBranch['title'] = data.branch;

    if (
      this.selectedFile &&
      this.selectedFile.properties['branches'] &&
      this.newBranch['title']
    ) {
      this.newBranch['description'] =
        (this.selectedFile.properties['branches'] as Dict<any>)[
          this.newBranch['title']
        ]?.description ?? '';
    }

    this.mode = this.selectedFile ? (this.newBranch['title'] ? 3 : 1) : 2;
  }

  ngOnInit(): void {}

  saveAPIKey(id: string, data: string = '') {
    this.newAPIKey = new Key(id, data);
    // this.apiKeyChanged.emit(apiKey);
  }

  async save(action = 'save') {
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
      action,
      ...this.newBranch,
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
