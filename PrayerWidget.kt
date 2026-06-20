package com.muhammadprayertimes.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import java.util.Calendar
import kotlin.math.abs

class PrayerWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.prayer_widget_layout)

            val (prayerName, timeStr, countdown) = getNextPrayer()

            views.setTextViewText(R.id.widget_prayer_name, prayerName)
            views.setTextViewText(R.id.widget_prayer_time, timeStr)
            views.setTextViewText(R.id.widget_countdown, countdown)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun getNextPrayer(): Triple<String, String, String> {
            val cal = Calendar.getInstance()
            val hour = cal.get(Calendar.HOUR_OF_DAY)
            val minute = cal.get(Calendar.MINUTE)
            val currentMinutes = hour * 60 + minute

            // Approximate prayer times (minutes from midnight)
            val prayers = listOf(
                Pair("Fajr", 5 * 60 + 0),
                Pair("Dhuhr", 12 * 60 + 30),
                Pair("Asr", 15 * 60 + 45),
                Pair("Maghrib", 18 * 60 + 30),
                Pair("Isha", 20 * 60 + 0)
            )

            var nextPrayer = prayers[0]
            var minDiff = Int.MAX_VALUE

            for (prayer in prayers) {
                val diff = prayer.second - currentMinutes
                if (diff > 0 && diff < minDiff) {
                    minDiff = diff
                    nextPrayer = prayer
                }
            }

            // If no prayer left today, next is Fajr tomorrow
            if (minDiff == Int.MAX_VALUE) {
                nextPrayer = prayers[0]
                minDiff = (24 * 60 - currentMinutes) + prayers[0].second
            }

            val hours = minDiff / 60
            val mins = minDiff % 60
            val timeHour = nextPrayer.second / 60
            val timeMin = nextPrayer.second % 60
            val amPm = if (timeHour < 12) "AM" else "PM"
            val displayHour = if (timeHour > 12) timeHour - 12 else if (timeHour == 0) 12 else timeHour

            val timeStr = String.format("%d:%02d %s", displayHour, timeMin, amPm)
            val countdown = String.format("in %dh %02dm", hours, mins)

            return Triple(nextPrayer.first, timeStr, countdown)
        }
    }
}
