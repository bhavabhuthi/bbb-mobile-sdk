package org.bbb.mobilesdk

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * React Native module to start/stop the audio foreground service.
 */
class AudioForegroundModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AudioForegroundModule"

    @ReactMethod
    fun startService(title: String?, subtitle: String?) {
        val intent = Intent(reactApplicationContext, AudioForegroundService::class.java).apply {
            putExtra(AudioForegroundService.EXTRA_TITLE, title)
            putExtra(AudioForegroundService.EXTRA_SUBTITLE, subtitle)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopService() {
        val intent = Intent(reactApplicationContext, AudioForegroundService::class.java)
        reactApplicationContext.stopService(intent)
    }
}
