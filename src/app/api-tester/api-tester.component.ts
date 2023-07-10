import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoadService, Dict } from '../load.service';
import { APIRequest } from '../models/workflow/api-request.model';
import { Executable } from '../models/workflow/executable.model';
import { Developer } from '../models/user/developer.model';

@Component({
  selector: 'app-api-tester',
  templateUrl: './api-tester.component.html',
  styleUrls: ['./api-tester.component.scss'],
})
export class ApiTesterComponent implements OnInit {
  loadingMode = 0;
  response = '';
  prettyResponse = '';
  image?: string;
  request = '';

  chats: { type: string; msg: string }[] = [];

  @Input() model?: Executable;
  user?: Developer;
  constructor(private loadService: LoadService) {}

  ngOnInit(): void {
    this.loadService.loadedUser.subscribe((l) => {
      if (l) {
        this.user = l;
      }
    });
  }

  async run() {
    if (this.request && this.request.trim() != '' && this.model) {
      this.loadingMode = 1;

      let url = await this.loadService.uploadExecutable(
        this.model!.id,
        this.model!
      );

      this.chats = [];
      this.chats.push({ type: 'user', msg: this.request });

      setTimeout(async () => {
        this.loadingMode = 2;

        if (url) {
          this.loadService.testAPI(url, this.request, async (result) => {
            if (this.loadingMode == 2) {
              console.log(result);
              this.image = undefined;

              if (result.data) {
                if (typeof result.data == 'string') {
                  let str = result.data as string;
                  let match = str.match(/^https?:\/\/.+\/.+$/) != null;
                  if (match) {
                    const doesImageExist = (url: string) => {
                      return new Promise((resolve) => {
                        const img = new Image();

                        img.src = url;
                        img.onload = () => resolve(true);
                        img.onerror = () => resolve(false);
                      });
                    };
                    let isImage =
                      ((await doesImageExist(str)) as boolean) ?? false;

                    if (isImage) {
                      this.image = result.data as string;
                    }

                    this.loadingMode = 0;
                  }
                }
              }

              this.response = JSON.stringify(result ?? '');
              this.prettyResponse = result.data ?? '';
              this.chats.push({ type: 'system', msg: this.prettyResponse });
              this.loadingMode = 0;
            }
          });
        } else {
          this.loadingMode = 0;
        }

        this.request = '';
      }, 500);

      this.loadingMode = 0;
    }
  }

  close() {}
}
