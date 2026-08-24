# Termux SMS 브리지 시작
pkg install python -y
cd ~
export ANDROID_SMS_BRIDGE_KEY='여기PC와같은키'
SMS_BRIDGE_LOG_FILE="${SMS_BRIDGE_LOG_FILE:-$HOME/sms-bridge.log}"
echo "SMS bridge log: $SMS_BRIDGE_LOG_FILE"
python sms_bridge.py 2>&1 | tee -a "$SMS_BRIDGE_LOG_FILE"
