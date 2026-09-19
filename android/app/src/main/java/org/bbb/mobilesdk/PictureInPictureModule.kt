package org.bbb.mobilesdk

import android.app.PictureInPictureParams
import android.os.Build
import android.util.Rational
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * Native module for Picture-in-Picture mode.
 * Enters PiP when the app is backgrounded during a meeting.
 */
class PictureInPictureModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PictureInPictureModule"

    @ReactMethod
    fun enterPip(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val params = PictureInPictureParams.Builder()
                    .setAspectRatio(Rational(9, 16))
                    .build()
                activity.enterPictureInPictureMode(params)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PIP_ERROR", e.message)
            }
        } else {
            promise.reject("UNSUPPORTED", "PiP requires Android O+")
        }
    }

    @ReactMethod
    fun isInPipMode(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            promise.resolve(activity.isInPictureInPictureMode)
        } else {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isPipSupported(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pm = activity.packageManager
            promise.resolve(pm.hasSystemFeature("android.software.picture_in_picture"))
        } else {
            promise.resolve(false)
        }
    }
}
