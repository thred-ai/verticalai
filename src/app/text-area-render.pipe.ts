import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textAreaRender'
})
export class TextAreaRenderPipe implements PipeTransform {

  transform(value: string): string {
    return value.replace(/\\n/g, "\n").replace(/\\t/g, "");;
  }

}
