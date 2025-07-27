import { staticFields } from './constants'

export interface SessionForm extends HTMLFormElement {
  elements: HTMLCollectionOf<HTMLElement>;
}

export interface Session extends StaticFieldsType {
  steeps: string[]
  customFields: Array<{ name: string, value: string }>
}

type StaticFieldKeys = typeof staticFields[number]
type RequiredStaticFields = 'datetime' | 'teaName'
type OptionalStaticFields = Exclude<StaticFieldKeys, RequiredStaticFields>

type StaticFieldsType = {
  [K in RequiredStaticFields]: string
} & {
  [K in OptionalStaticFields]?: string
}
