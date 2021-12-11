
export interface ContainerConnections {

  containerName: string
  connections: ContainerConnection[]
}

export interface ContainerConnection {

  adapterTypeName: string
  connectionDataList: Connection[]
}

export interface Connection {

  connectionAlias: string
  packageName: string
  connectionState: string
  endpoint: string
  port: string
}
