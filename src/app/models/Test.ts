export class Test {

    public package: string
    public cases: string[]

    constructor() {

    }

    public static make(data: any): Test {

        let t: Test = new Test()

        t.package = data.package
        t.cases = data.cases

        return t
    }
}
