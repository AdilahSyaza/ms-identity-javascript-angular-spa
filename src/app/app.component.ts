import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { AuthenticationResult, InteractionStatus, InteractionType, PopupRequest, RedirectRequest } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Sample App Representing Ding Dong';
  isIframe = false;
  loginDisplay = false;
  auth: string | null = '';
  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    console.log('at ding dong app');
    this.isIframe = window !== window.parent && !window.opener;

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.setLoginDisplay();
      });

      // this.route.fragment.subscribe(fragment => {
      //   const fragmentParams = new URLSearchParams(fragment!);
      //   const code = fragmentParams.get('code');
      //   if (code) {
      //     // Code received, handle authentication success
      //     console.log('Authentication success! Code:', code);
      //     // You can use the code to obtain access tokens or perform other actions
      //   } else {
      //     // No code received, handle authentication failure
      //     console.error('Authentication failed.');
      //     // Redirect to an error page or perform other actions
      //   }
      // });

      const url = new URL(window.location.href);
      console.log('url: ', url);
      this.auth = url.searchParams.get('auth');
      console.log('auth: ', this.auth);
      // if(auth === 'msalauth' && !this.loginDisplay){
      //   console.log('inside auth');
      //   this.login();
      // }
  }

  setLoginDisplay() {
    console.log('inside setLoginDisplay');
    // this.router.navigate([], {
    //   queryParams: {
    //     'auth': null,
    //     // 'youCanRemoveMultiple': null,
    //   },
    //   queryParamsHandling: 'merge'
    // })
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
    console.log('loginDisplay: ', this.loginDisplay);
    // console.log('auth: ', this.auth);
    // if(this.auth === 'msalauth' && !this.loginDisplay){
    //   console.log('inside auth');
    //   this.login();
    // } 
    // else{
    //   this.router.navigate([], {
    //     queryParams: {
    //       'auth': null,
    //       // 'youCanRemoveMultiple': null,
    //     },
    //     queryParamsHandling: 'merge'
    //   })
    // }
  }

  login() {
    console.log('inside login()');
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      if (this.msalGuardConfig.authRequest) {
        this.authService.loginPopup({ ...this.msalGuardConfig.authRequest } as PopupRequest)
          .subscribe((response: AuthenticationResult) => {
            this.authService.instance.setActiveAccount(response.account);
          });
      } else {
        this.authService.loginPopup()
          .subscribe((response: AuthenticationResult) => {
            this.authService.instance.setActiveAccount(response.account);
          });
      }
    } else {
      if (this.msalGuardConfig.authRequest) {
        this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
      } else {
        this.authService.loginRedirect();
      }
    }
  }

  logout() {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      this.authService.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/"
      });
    } else {
      this.authService.logoutRedirect({
        postLogoutRedirectUri: "/",
      });
    }
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
