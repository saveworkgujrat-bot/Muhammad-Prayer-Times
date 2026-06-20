import os

os.makedirs("android/app/src/main/res/xml", exist_ok=True)
os.makedirs("android/app/src/main/res/drawable", exist_ok=True)
os.makedirs("android/app/src/main/res/layout", exist_ok=True)
os.makedirs("android/app/src/main/java/com/muhammadprayertimes/app", exist_ok=True)

# Widget Info XML - Android 15 compatible
with open("android/app/src/main/res/xml/prayer_widget_info.xml", "w") as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:targetCellWidth="4"
    android:targetCellHeight="2"
    android:maxResizeWidth="450dp"
    android:maxResizeHeight="300dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/prayer_widget_layout"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:description="@string/app_name">
</appwidget-provider>''')

# Widget Background
with open("android/app/src/main/res/drawable/widget_bg.xml", "w") as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#0D1F1A"/>
    <corners android:radius="20dp"/>
</shape>''')

# Schedule Background
with open("android/app/src/main/res/drawable/schedule_bg.xml", "w") as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#152820"/>
    <corners android:radius="14dp"/>
</shape>''')

# Time Badge Background
with open("android/app/src/main/res/drawable/time_badge_bg.xml", "w") as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#1A3D30"/>
    <corners android:radius="6dp"/>
</shape>''')

# Widget Layout
with open("android/app/src/main/res/layout/prayer_widget_layout.xml", "w") as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:padding="14dp">
    <LinearLayout
        android:id="@+id/left_panel"
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_toLeftOf="@+id/right_panel"
        android:layout_alignParentLeft="true"
        android:orientation="vertical"
        android:gravity="center_vertical">
        <TextView android:layout_width="wrap_content" android:layout_height="wrap_content"
            android:text="NEXT PRAYER" android:textColor="#7AADA0" android:textSize="9sp"/>
        <LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content"
            android:orientation="horizontal" android:gravity="center_vertical" android:layout_marginTop="2dp">
            <TextView android:id="@+id/widget_prayer_name" android:layout_width="wrap_content"
                android:layout_height="wrap_content" android:text="Asr"
                android:textColor="#FFFFFF" android:textSize="20sp" android:textStyle="bold"/>
            <TextView android:id="@+id/widget_prayer_time" android:layout_width="wrap_content"
                android:layout_height="wrap_content" android:text="5:03 PM"
                android:textColor="#10B981" android:textSize="11sp"
                android:background="@drawable/time_badge_bg"
                android:paddingLeft="6dp" android:paddingRight="6dp"
                android:paddingTop="2dp" android:paddingBottom="2dp" android:layout_marginLeft="8dp"/>
        </LinearLayout>
        <TextView android:id="@+id/widget_countdown" android:layout_width="wrap_content"
            android:layout_height="wrap_content" android:text="01:49:52"
            android:textColor="#FFFFFF" android:textSize="26sp" android:textStyle="bold" android:layout_marginTop="2dp"/>
        <View android:layout_width="match_parent" android:layout_height="0.5dp"
            android:background="#2A4A3A" android:layout_marginTop="8dp" android:layout_marginBottom="6dp"/>
        <TextView android:id="@+id/widget_location" android:layout_width="wrap_content"
            android:layout_height="wrap_content" android:text="Gujrat"
            android:textColor="#10B981" android:textSize="11sp" android:textStyle="bold"/>
    </LinearLayout>
    <LinearLayout
        android:id="@+id/right_panel"
        android:layout_width="140dp"
        android:layout_height="match_parent"
        android:layout_alignParentRight="true"
        android:orientation="vertical"
        android:background="@drawable/schedule_bg"
        android:padding="10dp">
        <TextView android:layout_width="wrap_content" android:layout_height="wrap_content"
            android:text="TODAY SCHEDULE" android:textColor="#7AADA0"
            android:textSize="8sp" android:layout_marginBottom="6dp"/>
        <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginBottom="3dp">
            <TextView android:id="@+id/fajr_name" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Fajr" android:textColor="#CCFFFFFF" android:textSize="10sp"/>
            <TextView android:id="@+id/fajr_time" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="3:15 AM" android:textColor="#88AAAAAA" android:textSize="10sp"/>
        </LinearLayout>
        <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginBottom="3dp">
            <TextView android:id="@+id/dhuhr_name" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Dhuhr" android:textColor="#CCFFFFFF" android:textSize="10sp"/>
            <TextView android:id="@+id/dhuhr_time" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="12:05 PM" android:textColor="#88AAAAAA" android:textSize="10sp"/>
        </LinearLayout>
        <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginBottom="3dp">
            <TextView android:id="@+id/asr_name" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Asr" android:textColor="#CCFFFFFF" android:textSize="10sp"/>
            <TextView android:id="@+id/asr_time" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="5:03 PM" android:textColor="#88AAAAAA" android:textSize="10sp"/>
        </LinearLayout>
        <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginBottom="3dp">
            <TextView android:id="@+id/maghrib_name" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Maghrib" android:textColor="#CCFFFFFF" android:textSize="10sp"/>
            <TextView android:id="@+id/maghrib_time" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="7:14 PM" android:textColor="#88AAAAAA" android:textSize="10sp"/>
        </LinearLayout>
        <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal">
            <TextView android:id="@+id/isha_name" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Isha" android:textColor="#CCFFFFFF" android:textSize="10sp"/>
            <TextView android:id="@+id/isha_time" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="8:55 PM" android:textColor="#88AAAAAA" android:textSize="10sp"/>
        </LinearLayout>
    </LinearLayout>
</RelativeLayout>''')

# Kotlin Widget File
with open("android/app/src/main/java/com/muhammadprayertimes/app/PrayerWidget.kt", "w") as f:
    f.write('''package com.muhammadprayertimes.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import java.util.Calendar

class PrayerWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) updateAppWidget(context, appWidgetManager, id)
    }
    override fun onEnabled(context: Context) { super.onEnabled(context) }
    override fun onDisabled(context: Context) { super.onDisabled(context) }
    companion object {
        val PRAYERS = listOf(
            Triple("Fajr",    3 * 60 + 15,  "3:15 AM"),
            Triple("Dhuhr",  12 * 60 + 5,  "12:05 PM"),
            Triple("Asr",    17 * 60 + 3,   "5:03 PM"),
            Triple("Maghrib",19 * 60 + 14,  "7:14 PM"),
            Triple("Isha",   20 * 60 + 55,  "8:55 PM")
        )
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.prayer_widget_layout)
            val cal = Calendar.getInstance()
            val now = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
            var nextPrayer = PRAYERS[0]; var minDiff = Int.MAX_VALUE
            for (p in PRAYERS) { val diff = p.second - now; if (diff > 0 && diff < minDiff) { minDiff = diff; nextPrayer = p } }
            if (minDiff == Int.MAX_VALUE) { nextPrayer = PRAYERS[0]; minDiff = 1440 - now + PRAYERS[0].second }
            val hh = minDiff / 60; val mm = minDiff % 60; val ss = cal.get(Calendar.SECOND)
            views.setTextViewText(R.id.widget_prayer_name, nextPrayer.first)
            views.setTextViewText(R.id.widget_prayer_time, nextPrayer.third)
            views.setTextViewText(R.id.widget_countdown, String.format("%02d:%02d:%02d", hh, mm, 60 - ss))
            views.setTextViewText(R.id.widget_location, "Gujrat")
            val ids = listOf(
                Triple(R.id.fajr_name, R.id.fajr_time, PRAYERS[0]),
                Triple(R.id.dhuhr_name, R.id.dhuhr_time, PRAYERS[1]),
                Triple(R.id.asr_name, R.id.asr_time, PRAYERS[2]),
                Triple(R.id.maghrib_name, R.id.maghrib_time, PRAYERS[3]),
                Triple(R.id.isha_name, R.id.isha_time, PRAYERS[4]))
            for ((nId, tId, p) in ids) {
                val c = if (p.first == nextPrayer.first) 0xFF10B981.toInt() else 0xCCFFFFFF.toInt()
                val tc = if (p.first == nextPrayer.first) 0xFF10B981.toInt() else 0x88AAAAAA.toInt()
                views.setTextColor(nId, c); views.setTextColor(tId, tc)
                views.setTextViewText(tId, p.third)
            }
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}''')

print("All widget files created successfully!")
