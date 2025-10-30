#!/bin/bash

# Monitor ClientCulture reminder email sending in real-time
# Runs locally, queries production server via SSH
# Safe: Read-only queries, no data modification

# Configuration
PEM_KEY="$HOME/projects/pem/KlientKulture.pem"
SERVER="ec2-user@clientculture.net"
VENDOR_ID="vQOAvbIlLNKbv"  # Netwealth
DB_HOST="klientkulture.ckyictiybzxv.ap-southeast-2.rds.amazonaws.com"
DB_USER="admin"
DB_PASS="R36S4pd1l0tU04bmymXO"
DB_NAME="KlientKulture"
REFRESH_INTERVAL=5  # seconds

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "ClientCulture Reminder Monitor"
echo "=========================================="
echo "Vendor: Netwealth ($VENDOR_ID)"
echo "Refresh: Every $REFRESH_INTERVAL seconds"
echo "Press Ctrl+C to stop"
echo "=========================================="
echo ""

# Track start count
START_COUNT=$(ssh -i "$PEM_KEY" "$SERVER" "mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -N -e \"SELECT COUNT(*) FROM Survey_Log WHERE vendorId = '$VENDOR_ID' AND reminderSentOnDate IS NOT NULL AND DATE(reminderSentOnDate) = CURDATE();\"" 2>/dev/null)

if [ -z "$START_COUNT" ]; then
    echo -e "${RED}Error: Could not connect to database${NC}"
    exit 1
fi

echo -e "${BLUE}Starting count: $START_COUNT${NC}"
echo ""

# Monitor loop
COUNTER=0
while true; do
    COUNTER=$((COUNTER + 1))
    TIMESTAMP=$(date "+%H:%M:%S")

    # Query database via SSH
    RESULT=$(ssh -i "$PEM_KEY" "$SERVER" "mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -N -e \"
        SELECT
            COUNT(*) as sent_today,
            MAX(reminderSentOnDate) as last_sent
        FROM Survey_Log
        WHERE vendorId = '$VENDOR_ID'
        AND reminderSentOnDate IS NOT NULL
        AND DATE(reminderSentOnDate) = CURDATE();
    \"" 2>/dev/null)

    if [ -n "$RESULT" ]; then
        # Parse result
        SENT_COUNT=$(echo "$RESULT" | awk '{print $1}')
        LAST_SENT=$(echo "$RESULT" | awk '{print $2, $3}')

        # Calculate progress
        NEW_SENT=$((SENT_COUNT - START_COUNT))

        # Calculate rate (emails per minute)
        ELAPSED=$((COUNTER * REFRESH_INTERVAL))
        if [ $ELAPSED -gt 0 ] && [ $NEW_SENT -gt 0 ]; then
            RATE=$(echo "scale=1; $NEW_SENT * 60 / $ELAPSED" | bc)
        else
            RATE="0.0"
        fi

        # Calculate ETA for 600 emails
        REMAINING=$((600 - NEW_SENT))
        if [ "$RATE" != "0.0" ] && [ $REMAINING -gt 0 ]; then
            ETA_SECONDS=$(echo "scale=0; $REMAINING * 60 / $RATE" | bc)
            ETA_MINUTES=$((ETA_SECONDS / 60))
            ETA_SECONDS=$((ETA_SECONDS % 60))
            ETA_STR=$(printf "%02d:%02d" $ETA_MINUTES $ETA_SECONDS)
        else
            ETA_STR="--:--"
        fi

        # Color code based on activity
        if [ $NEW_SENT -ge 600 ]; then
            COLOR=$GREEN
            STATUS="✓ COMPLETE"
        elif [ $NEW_SENT -gt 0 ]; then
            COLOR=$YELLOW
            STATUS="⟳ SENDING"
        else
            COLOR=$BLUE
            STATUS="⏳ WAITING"
        fi

        # Display update
        echo -e "${COLOR}[$TIMESTAMP] $STATUS${NC}"
        echo -e "  Sent today: ${GREEN}$SENT_COUNT${NC} | New in this batch: ${YELLOW}$NEW_SENT${NC}/600"
        echo -e "  Rate: ${BLUE}$RATE${NC} emails/min | ETA: ${BLUE}$ETA_STR${NC}"
        echo -e "  Last sent: $LAST_SENT"
        echo "  ────────────────────────────────────────"

        # Stop if complete
        if [ $NEW_SENT -ge 600 ]; then
            echo ""
            echo -e "${GREEN}✓ Batch complete! 600 emails sent.${NC}"
            echo ""
            break
        fi
    else
        echo -e "${RED}[$TIMESTAMP] Error querying database${NC}"
    fi

    sleep $REFRESH_INTERVAL
done

echo "Monitoring stopped."
