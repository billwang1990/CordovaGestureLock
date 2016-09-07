//
//  GestureLock.h
//  ChatOps
//
//  Created by Bill Wang on 9/7/16.
//
//

#import <Foundation/Foundation.h>
#import <Cordova/CDV.h>
#import <Cordova/CDVPlugin.h>

@interface GestureLock : CDVPlugin
- (void)showGestureLock:(CDVInvokedUrlCommand*)command;
@end
