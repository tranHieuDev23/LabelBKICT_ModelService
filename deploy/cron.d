# This command helps update detection tasks that are stuck in PROCESSING status after a certain amount of time back to REQUESTED status.
* * * * * node /build/dist/main.js --update_processing_detection_task_to_requested
# This command triggers the manual processing of REQUESTED detection tasks
*/30 * * * * node /build/dist/main.js --process_requested_detection_task
