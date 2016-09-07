#import "GestureLock.h"

@interface UIViewController (Utils)
+ (UIViewController*)currentViewController;
@end

@implementation UIViewController (Utils)

+ (UIViewController*)findTopMostViewController : (UIViewController*)vc {
    
    if (vc.presentedViewController) {
        
        // Return presented view controller
        return [UIViewController findTopMostViewController:vc.presentedViewController];
        
    } else if ([vc isKindOfClass:[UISplitViewController class]]) {
        
        // Return right hand side
        UISplitViewController* svc = (UISplitViewController*) vc;
        if (svc.viewControllers.count > 0)
            return [UIViewController findTopMostViewController:svc.viewControllers.lastObject];
        else
            return vc;
        
    } else if ([vc isKindOfClass:[UINavigationController class]]) {
        
        // Return top view
        UINavigationController* svc = (UINavigationController*) vc;
        if (svc.viewControllers.count > 0)
            return [UIViewController findTopMostViewController:svc.topViewController];
        else
            return vc;
        
    } else if ([vc isKindOfClass:[UITabBarController class]]) {
        
        // Return visible view
        UITabBarController* svc = (UITabBarController*) vc;
        if (svc.viewControllers.count > 0)
            return [UIViewController findTopMostViewController:svc.selectedViewController];
        else
            return vc;
        
    } else {
        return vc;
    }
}

+ (UIViewController*)currentViewController {
    UIViewController* viewController = [UIApplication sharedApplication].keyWindow.rootViewController;
    return [UIViewController findTopMostViewController:viewController];
    
}

@end

@interface GestureLockController : UIViewController<UIWebViewDelegate>
@end

@implementation GestureLockController {
    UIWebView *webView;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    webView = [[UIWebView alloc] initWithFrame:self.view.bounds];
    [self.view addSubview:webView];
    
    NSString *htmlPath = [[NSBundle mainBundle] pathForResource:@"GestureLockView.html" ofType:nil inDirectory:@"www/gestureLock"];

    NSURLRequest *request = [[NSURLRequest alloc] initWithURL:[[NSURL alloc] initWithString:htmlPath]];
    [webView loadRequest:request];
    webView.delegate = self;
}


- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
    
    NSURL *url = [request URL];
    if ([[[url scheme] lowercaseString] isEqualToString:@"gesturelockcustomscheme"] ) {
        
        dispatch_time_t time = dispatch_time ( DISPATCH_TIME_NOW , 0.5 * NSEC_PER_SEC ) ;
        dispatch_after ( time , dispatch_get_main_queue () , ^ {
            [[NSNotificationCenter defaultCenter] postNotificationName:@"gestureLockEvent" object:nil];
        });
        return  NO;
    }
    return YES;
}

@end

@implementation GestureLock
{
    NSTimeInterval _showGestureLockInterval;
    NSUserDefaults *_userDefault;
}

- (void)pluginInitialize {
    _showGestureLockInterval = 5 * 60;
    _userDefault = [NSUserDefaults standardUserDefaults];
    [self registNotificationHandler];
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)showGestureLockIfNeeded {
    if ([self shouldShowGestureLock]) {
        [self showGestureLock];
    }
}

- (BOOL)shouldShowGestureLock {
    NSNumber *previous = [_userDefault valueForKey:@"previousAttempt"];
    if (previous != nil) {
        NSTimeInterval previousInterval = [previous doubleValue];
        NSTimeInterval currentInterval = [[[NSDate alloc] init] timeIntervalSince1970];
        return  currentInterval - previousInterval > _showGestureLockInterval;
    }
    return NO;
}

- (void)handleUnLockEvent {
    NSTimeInterval current = [[[NSDate alloc] init] timeIntervalSince1970];
    [_userDefault setValue:[NSNumber numberWithDouble:current] forKey:@"previousAttempt"];
    [_userDefault synchronize];
    [self hideGestureLock];
}

- (void)showGestureLock:(CDVInvokedUrlCommand*)command {
    [self showGestureLockIfNeeded];
}

- (void)registNotificationHandler {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(showGestureLockIfNeeded) name:UIApplicationDidBecomeActiveNotification object:nil
     ];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleUnLockEvent) name:@"gestureLockEvent" object:nil
     ];
}

- (void)showGestureLock {
    UIViewController *vc = [UIViewController currentViewController];
    if (vc != nil && ![vc isKindOfClass:[GestureLockController class]]) {
        [vc presentViewController:[GestureLockController new] animated:YES completion: nil];
    }
}

- (void)hideGestureLock {
    UIViewController *vc = [UIViewController currentViewController];
    if ([vc isKindOfClass: [GestureLockController class]]) {
        [vc dismissViewControllerAnimated:YES completion:nil];
    }
}

@end
