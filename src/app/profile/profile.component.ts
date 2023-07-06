import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoadService } from '../load.service';
import { Developer } from '../models/user/developer.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ProfileComponent>,
    private loadService: LoadService
  ) {
    this.profileForm.controls['url'].setValue({
      url: data.dev?.url ? data.dev?.url : null,
      file: null,
      changed: false,
    });
    this.profileForm.controls['name'].setValue(data.dev?.name);
    this.profileForm.controls['email'].setValue(data.dev?.email);
  }

  profileForm = this.fb.group({
    name: [null, Validators.required],
    url: [{ url: null, file: null, changed: false }, Validators.required],
    email: [null, Validators.required],
  });

  loading = false;

  close() {
    this.dialogRef.close();
  }

  async fileChangeEvent(event: any): Promise<void> {
    console.log(event);

    let file = event.target.files[0];

    let buffer = await file.arrayBuffer();

    var blob = new Blob([buffer]);

    var reader = new FileReader();
    reader.onload = (event: any) => {
      var base64 = event.target.result;
      this.profileForm.controls['url'].setValue({
        url: base64,
        file,
        changed: true,
      });
    };

    reader.readAsDataURL(blob);

    console.log(file);
  }

  save() {
    if (this.profileForm.valid) {
      this.loading = true;
      let name = this.profileForm.controls['name'].value;
      let img = this.profileForm.controls['url'].value;
      let url = img.url;
      let uploadImage = img.changed;
      let file = img.file as File;

      let uid = this.data.dev?.id;
      let email = this.profileForm.controls['email'].value;

      let dev = new Developer(name, uid, 0, url, email);
      this.loadService.saveUserInfo(dev, file, uploadImage, (result) => {
        this.loading = false;
        if (result) {
          this.dialogRef.close(result);
        } else {
        }
      });
    }
  }

  ngOnInit(): void {}
}
