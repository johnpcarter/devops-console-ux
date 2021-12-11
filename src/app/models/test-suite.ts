export class TestSuiteResults {

  public name: string
  public instances: TestInstance[]
  public total: number = 0

  public static make(data: any): TestSuiteResults {

     let r: TestSuiteResults = new TestSuiteResults()
     r.name = data.name
     r.instances = []

     if (data.instances != null) {
       data.instances.forEach((i) => {
         let instance = TestInstance.make(i)
         r.instances.push(instance)

         r.total += instance.total
       })
     }

     return r
   }
}

export class TestInstance {
  public id: string
  public testSuites: TestSuite[]
  public total: number = 0

   public static make(data: any): TestInstance {

     let i: TestInstance = new TestInstance()
     i.id = data.id
     i.testSuites = []

     data.testSuites.forEach((t) => {
       let ts = TestSuite.make(t)
        i.testSuites.push(ts)

        i.total += ts.total
     })

     return i
   }
}

export class TestSuite {
  public name: string
  public errors: number
  public failures: number
  public total: number

  public cases: TestCase[]

  public static make(data: any): TestSuite {

    let ts: TestSuite = new TestSuite()
    ts.name = data.name
    ts.errors = data.errors
    ts.failures = data.failures
    ts.total = data.total

    ts.cases = []

    if (data.cases) {
      data.cases.forEach((c) => {

        ts.cases.push(TestCase.make(c))
      })
    }

    return ts
  }
}

export class TestCase {

  public name: string
  public duration: number
  public error: string

  public static make(data: any): TestCase {
    //let jsonObj: any = JSON.parse(json)

    let t: TestCase = new TestCase()

    t.name = data.name
    t.duration = data.duration
    t.error = data.error

    return t
  }
}
