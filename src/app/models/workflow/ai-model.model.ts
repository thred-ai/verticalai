import { Request } from "./request.model";

export class AIModel {
  name!: string;
  developer!: string;
  id!: string;
  request!: Request;
  imgUrl!: string;
  type!: string;
  status!: number;
  trainable: string[]
  description: string

  constructor(
    name: string,
    id: string,
    developer: string,
    request: Request,
    imgUrl: string,
    type: string,
    status: number,
    trainable: string[],
    description?: string
  ) {
    this.id = id;
    this.developer = developer ?? 'Unknown Developer';
    this.name = name ?? 'New Model';
    this.request = request;
    this.imgUrl = imgUrl ?? '';
    this.type = type ?? 'Unknown';
    this.status = status ?? 1
    this.trainable = trainable ?? []
    this.description = (description ?? '').split("/n").join('<br>')
  }
}
