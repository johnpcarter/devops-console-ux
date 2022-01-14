export enum DisplayType {
    hidden = "hidden",
    readonly = "readonly",
    editable = "editable",
    password = "password",
    file = "file",
    dropdown = "dropdown",
    yesno = "yesno"
}

export class ArgDisplayType {

    public name: string
    public description: string
    public display: DisplayType = DisplayType.hidden
    public conditions: string[]
    public choices: string[]
    public required: boolean = true

    public constructor(name: string) {
        this.name = name
        this.description = this.name
        this.conditions = []
        this.choices = []
    }

    public copy(): ArgDisplayType {

        let copy: ArgDisplayType = new ArgDisplayType(this.name)
        copy.description = this.description
        copy.display = this.display
        copy.conditions = this.conditions
        copy.choices = this.choices
        copy.required = this.required

        return copy
    }

    public static make(d: any): ArgDisplayType {

        let a: ArgDisplayType = new ArgDisplayType(d.name)

        if (d.display == "editable")
            a.display = DisplayType.editable
        else if (d.display == "readonly")
            a.display = DisplayType.readonly
        else if (d.display == "file")
            a.display = DisplayType.file
        else if (d.display == "password")
            a.display = DisplayType.password
        else if (d.display == "yesno")
            a.display = DisplayType.yesno
        else if (d.display == "dropdown")
            a.display = DisplayType.dropdown
        else
            a.display = DisplayType.hidden

        if (d.required != null)
            a.required = d.required

        a.description = d.description || d.name

        if (d.conditions)
            a.conditions = d.conditions

        if (a.choices)
            a.choices = d.choices

        return a
    }

    public matchConditions(args: Map<string, string>): boolean {

        return ArgDisplayType._matchConditions(this.conditions, args)
    }

    public static _matchConditions(conditions: string[], args: Map<string, string>): boolean {

        if (conditions && conditions.length > 0) {

            let matched: boolean = false

            for (let i = 0; i < conditions.length; i++) {
                let m: string = conditions[i]

                if (m.indexOf("==") != -1) {
                    let k: string = m.substring(0, m.indexOf("=="))
                    let v: string = m.substring(m.indexOf("==")+2)

                    if (args.get(k) == v || (v == "false" && !args.get(k)))
                        matched = true

                } else if (m.indexOf("!=") != -1) {
                    let k: string = m.substring(0, m.indexOf("!="))
                    let v: string = m.substring(m.indexOf("!=")+2)

                    if (args.get(k) != v)
                        matched = true

                } else if (args.get(m) && args.get(m) != "false")
                    matched = true
            }

            return matched
        } else {
            return true
        }
    }
}
