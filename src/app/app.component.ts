import { ViewChild, OnInit, OnDestroy }                from '@angular/core'
import { Component, ChangeDetectorRef }                from '@angular/core'

import { ActivatedRoute, RouterOutlet, Router,
  NavigationEnd }                                      from '@angular/router'

import { Location }                                    from "@angular/common"

import { trigger, style, transition, animate,
              query, group, animateChild }             from '@angular/animations'

import { MediaMatcher }                                from '@angular/cdk/layout'

import { MatDialog }                                   from '@angular/material/dialog'
import { AboutComponent }                              from './components/about.component'
import {filter, map, startWith} from 'rxjs/operators'
import {Observable} from 'rxjs'
import {Settings} from './settings'
import {FormControl} from '@angular/forms'

@Component({
  selector: 'app-root',
  templateUrl: './templates/app.component.html',
  styleUrls: ['./templates/app.component.css'],
  animations: [
      trigger('routeAnimations', [
          transition('* <=> *', [
            style({ position: 'relative' }),
            query(':enter, :leave', [
              style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%'
              })
            ], {optional: true}),
            query(':enter', [
              style({ left: '-100%'})
            ], {optional: true}),
            query(':leave', animateChild(), {optional: true}),
            group([
              query(':leave', [
                animate('500ms ease-out', style({ left: '100%'}))
              ], {optional: true}),
              query(':enter', [
                animate('300ms ease-out', style({ left: '0%'}))
              ], {optional: true})
            ]),
            query(':enter', animateChild(), {optional: true})
          ])
        ])
      ]
  })

export class AppComponent implements OnInit, OnDestroy {

    public static VERSION = "1.6"

    public currentRouteURL: string
    public currentRouteURLObserver: any
    public currentMenu: any
    public environments: string[] = []
    public version = "1.0"

    constructor(private router: Router, private _location: Location, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher,
              private _dialog: MatDialog, private _router: Router, private _route: ActivatedRoute, public settings: Settings) {

        this.version = AppComponent.VERSION

    this.settings.environments().subscribe((e) => {
      this.environments = e
    })
  }

  public ngOnInit() {

    this.currentRouteURLObserver =
      this.router.events.pipe(startWith(this.router), filter(
         (event) => event instanceof NavigationEnd || event instanceof Router
     ), map((event: NavigationEnd | Router) => event.url)).subscribe(r => {
        this.currentRouteURL = r

        if (this.currentMenu == null || this.currentMenu.id != this.currentRouteURL) {
          // find route menu first

          let path = this.currentRouteURL

          if (this.currentRouteURL.lastIndexOf("/") > 0) {
            path = this.currentRouteURL.substring(0, this.currentRouteURL.lastIndexOf("/"))
          }

          if (path.indexOf(";") != -1) {
            path = path.substring(0, path.lastIndexOf(";"))
          }

          let m = menus.get(path)

          this.currentMenu = {}
          this.currentMenu.id = path
          this.currentMenu.label = m.label
          this.currentMenu.alt = m.alt
          this.currentMenu.description = m.description
          this.currentMenu.children = m.children
        }

        // check for sub-level

        //if (this.currentRouteURL.lastIndexOf("/") > 0) {
          var m = menus.get(this.currentRouteURL)

          if (m != null) {
              this.currentMenu.label = m.label
              this.currentMenu.description = m.description
          }
        //}
      })
  }

  public ngOnDestroy() {
  }

  public selectedEnvironmentChanged(event) {

    this.settings.currentEnvironment = event.value
  }

  public classForMenuItem(path: string): string {

    if (this.currentRouteURL.indexOf(path) != -1) {
      return "toolbar-item-selected"
    } else {
      return ""
    }
  }

  public classForSubmenuItem(path: string): string {
    if (this.currentRouteURL == path) {
        return "page-title-navigation-item page-title-navigation-item-selected"
    }  else {
        return "page-title-navigation-item"
    }
  }

  public labelForSubmenu(path: string): string {

    if (menus.get(path)) {
      return menus.get(path).alt || menus.get(path).label
    } else {
      return "** "+path+" **"
    }
  }

  public prepareRoute(outlet: RouterOutlet): boolean {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation']
  }
}

const menus:Map<string, any> = new Map([

     ["/", {
       "label": "Welcome",
       "description": "End to end solution for docker image creation and deployment for all your micro service requirements, powered by webMethods.",
       "icon": "home",
       "iconClass": "fas",
       "isTop": true
     }
     ],
     ["/build", {
       "label": "Build",
       "description": "Identify your source code and create your docker images here",
       "alt": "Available images",
       "icon": "box",
       "iconClass": "fas",
       "isTop": true,
       "children": [
         "/build",
         "/build/package",
           "/build/properties",
         "/build/image"
       ]
     }
     ],
     ["/deploy", {
       "label": "Containers",
       "alt": "Running Containers",
       "description": "Deploy and manage your containers",
       "icon": "rocket",
       "iconClass": "fas",
       "isTop": true,
       "children": [
         "/deploy",
         "/deploy/run",
         "/deploy/stage"
       ]
     }
     ],
     ["/test", {
       "label": "Test",
       "alt": "Test results",
       "description": "Review your container testing",
       "icon": "vial",
       "isTop": true,
       "children": [
         "/test",
         "/test/history",
       ]
     }
     ],
     ["/k8s", {
       "label": "Kubernetes",
       "alt": "Deployed pods",
       "description": "Deploy your containers into a kubernetes container environment",
       "iconClass": "img",
       "icon": "assets/_images/k8s-logo.png",
       "isTop": true,
       "children": [
         "/k8s",
         "/k8s/scale",
         "/k8s/update"
       ]
     },
     ],
     ["/settings", {
       "label": "Preferences",
       "description": "Configure your environment, from docker host to your remote git repository.",
       "icon": "cog",
       "isTop": true
     }],
     ["/build/install", {
       "label": "Create webMethods Base Image",
       "description": "Create a base image for your MicroService Runtime, API Gateway, mysql DB etc."
     }],
     ["/build/package", {
       "label": "Package Source Code",
       "description": "Group your source code and configuration in preparation for creating a micro service image"
     }],
    ["/build/properties", {
        "label": "Configuration Variables",
        "description": "Create and edit configuration variables template for webMethods Microservices runtime"
    }],
     ["/build/image", {
       "label": "Create Microservice Image",
       "description": "Combine your base webMethods packages and source code into a self contained image, ready to be deployed and tested."
     }],
     ["/deploy/run", {
       "label": "Startup your containers",
       "description": "Spin up a set of containers to test drive an API driven micro service"
     }],
     ["/deploy/stage", {
       "label": "Orchestrate Actions via Jenkins Script",
       "description": "Generate a jenkins script to start, test and deploy an API driven micro service"
     }],
      ["/k8s/scale", {
       "label": "Manage Performance thru horizontal scaling",
       "description": "Increase or decrease the number of running pods"
     }],
     ["/k8s/update", {
       "label": "Change running version",
       "description": "Update micro service version live"
     }],
     ["/test/history", {
       "label": "Archived Test Results",
       "description": "Previous test cases"
     }],
    ["/home", {
      "label": "Welcome",
      "description": "End to end solution for docker image creation and deployment for all your micro service requirements, powered by webMethods."
    }
    ]
 ])
