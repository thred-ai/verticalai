export class Document {
  id!: string;
  text!: string;
  embedding: number[];

  constructor(id: string, text: string, embedding: number[]) {
    this.id = id;
    this.text = text;
    this.embedding = embedding ?? [];
  }
}
