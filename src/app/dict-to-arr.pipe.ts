import { Pipe, PipeTransform } from '@angular/core';
import { Dict } from './load.service';

@Pipe({
  name: 'dictToArr',
})
export class DictToArrPipe implements PipeTransform {
  transform(value: Dict<any>, fn: 'keys' | 'values' = 'keys'): any[] {
    const map1 = new Map();

    Object.keys(value).forEach((key, index) => {
      map1.set(key, value[key]);
    });

    return Array.from(map1, ([name, value]) => ({ name, value }));

  }
}
