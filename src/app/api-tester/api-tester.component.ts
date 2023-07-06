import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoadService, Dict } from '../load.service';
import { APIRequest } from '../models/workflow/api-request.model';
import { Workflow } from '../models/workflow/workflow.model';
import { Developer } from '../models/user/developer.model';

@Component({
  selector: 'app-api-tester',
  templateUrl: './api-tester.component.html',
  styleUrls: ['./api-tester.component.scss'],
})
export class ApiTesterComponent implements OnInit {
  loading = false;
  response = '';
  prettyResponse = '';
  image?: string;
  request = 'Hello!';

  chats: { type: string; msg: string }[] = [];

  @Input() model?: Workflow;
  user?: Developer;
  constructor(private loadService: LoadService) {}

  ngOnInit(): void {
    this.loadService.loadedUser.subscribe((l) => {
      if (l) {
        this.user = l;
      }
    });
  }

  run() {
    if (this.request && this.request.trim() != '' && this.model) {
      this.chats.push({ type: 'user', msg: this.request });

      setTimeout(() => {
        this.loading = true;

        this.loadService.testAPI(
          this.model!.id,
          this.request,
          async (result) => {
            if (this.loading) {
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

                    this.loading = false;
                  }
                }
              }

              this.response = JSON.stringify(result ?? '');
              this.prettyResponse = result.data ?? '';
              this.chats.push({ type: 'system', msg: this.prettyResponse });
              this.loading = false;
            }
          }
        );
        this.request = '';
      }, 500);
    }
  }

  close() {}
}
