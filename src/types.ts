export interface SessionForm extends HTMLFormElement {
  elements: HTMLCollectionOf<HTMLElement>;
}

export interface Session {
  datetime: string
  brewingVessel: string
  teaName: string
  teaProducer: string
  origin: string
  purchaseLocation: string
  dryLeaf: string
  wetLeaf: string
  additionalNotes: string
  steeps: string[]
  customFields: Array<{ name: string, value: string }>
}

