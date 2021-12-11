
export interface MicrogatewayReferences {
  name
  apis: APIReference[]
}

export interface APIReference {

  name
  endpoint
  port
  endpointUrl
}
