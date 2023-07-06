import { Workflow } from "../workflow/workflow.model";

export class Developer {
  name!: string;
  id!: string;
  url!: string;
  date!: number;
  email!: string;
  utils?: Workflow[];

  constructor(
    name: string,
    id: string,
    date: number,
    url: string,
    email: string,
    utils?: Workflow[]
  ) {
    this.name = name ?? 'New';
    this.id = id;
    this.utils = utils;
    this.date = date ?? 3;
    this.url = url;
    this.email = email;
  }
}
