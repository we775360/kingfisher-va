declare module 'node-fsuipc' {
  class FSUIPC {
    open(): Promise<void>
    close(): Promise<void>
    read(offset: number, size: number, type: string): Promise<any>
    readString(offset: number, size: number): Promise<string>
    write(offset: number, size: number, type: string, value: any): Promise<void>
  }
  export { FSUIPC }
}
