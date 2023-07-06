import { Pipe, PipeTransform } from '@angular/core';
import { Dict } from './load.service';
import { Workflow } from './models/workflow/workflow.model';

@Pipe({
  name: 'location',
})
export class LocationPipe implements PipeTransform {
  transform(value?: Dict<any>[], filterVal?: string, mode = 0, utils?: Workflow[]) {
    var x = value ?? [];

    if (filterVal) {
      x = value?.filter((v) => v['type'] == filterVal) ?? [];
    }

    let r =
      x.map((v) => ({
        id:
          mode == 0
            ? `${v['address'].city}, ${v['address'].country}`
            : `${v['docId']}`,
        name:
          mode == 0
            ? `${v['address'].city}, ${v['address'].country}`
            : this.assetName(`${v['docId']}`, utils),
        type: v['type'],
        coords: v['coords'],
      })) ?? [];

    var l: Dict<{
      name: string;
      id: string;
      views: number;
      sales: number;
      coords: any;
      count: number;
    }> = {};

    r.forEach((k) => {
      let v = l[`${k.id}`];
      let name = k.name;
      let id = k.id;
      let type = k.type;
      let views = 0;
      let sales = 0;
      let count = 0;

      if (v) {
        if (type == 'VIEW') {
          views = v.views + 1;
          sales = v.sales;
        } else if (type == 'SALE') {
          sales = v.sales + 1;
          views = v.views;
        }
      } else {
        if (type == 'VIEW') {
          views = 1;
        } else if (type == 'SALE') {
          sales = 1;
        }
      }
      count = views + sales * 2;
      l[`${id}`] = {
        name,
        id,
        views,
        sales,
        coords: mode == 0 ? k.coords : undefined,
        count,
      };
    });

    if (Object.keys(l).length > 0) {
      let most = Object.values(l).sort((a, b) => (a.count > b.count ? -1 : 1));

      return most;
    }
    return [];
  }

  assetName(id: string, items: Workflow[] = []) {
    let col = items.find((c) => c.id == id);
    if (col) {
      return col.name;
    } else {
      return '';
    }
  }
}
