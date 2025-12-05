# Change Proposal: Blocked Website API Integration

## Summary
Add API integration to send blocked website URLs to an external Feishu (Lark) API when users attempt to access restricted sites.

## Change Type
- [ ] Feature addition
- [x] Enhancement
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Description
Currently, when LeechBlockNG blocks a website, it only displays a blocking page locally. This change adds functionality to call an external API to log the blocked website URLs for analytics and allows users to add reasons for accessing blocked sites.

## Enhanced Features
### Phase 1: Basic API Integration ✅ COMPLETED
- Log blocked website URLs to external Feishu API
- Non-blocking API calls with error handling
- Rate limiting to prevent API spam
- User-configurable API settings

### Phase 2: Reason Input and Record Update 🆕 NEW
- Add input field and submit button on blocked page for entering access reasons
- Capture record_id from batch_create API response
- Update record with user-provided reason in "备注" (Remarks) field
- Enhanced user interaction and data collection

## Files to Modify
1. `blocked.js` - Add API call logic, reason input handling, and UI updates
2. `background.js` - Add API helper functions, update logic, and record management
3. `common.js` - Add API configuration and utilities
4. `options.html` - Add API configuration settings and field name options
5. `options.js` - Add API settings management logic
6. `blocked.html` - Add reason input UI elements and styling

## Implementation Details

### API Configuration
- Add new fields to options page for:
  - API endpoint URL
  - Authorization token
  - Enable/disable API logging option
  - Field names for website URL and remarks (defaults: "网站", "备注")

### Enhanced API Call Logic
```javascript
// Function to call Feishu API and return record_id
async function logBlockedWebsiteWithResponse(url) {
    const apiConfig = await getApiConfig();
    if (!apiConfig.enabled) return null;

    const response = await fetch(apiConfig.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.token}`
        },
        body: JSON.stringify({
            records: [{
                fields: {
                    [apiConfig.fieldName]: url
                }
            }]
        })
    });

    const result = await response.json();
    if (result.code === 0 && result.data.records.length > 0) {
        return result.data.records[0].record_id;
    }
    return null;
}

// Function to update record with reason
async function updateRecordWithReason(recordId, reason) {
    const apiConfig = await getApiConfig();
    if (!recordId || !reason) return false;

    const updateUrl = apiConfig.endpoint.replace('/records/batch_create', `/records/${recordId}`);

    const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.token}`
        },
        body: JSON.stringify({
            fields: {
                [apiConfig.remarksFieldName]: reason
            }
        })
    });

    return response.ok;
}
```

### Enhanced Integration Points
**Phase 1:**
- Call `logBlockedWebsiteWithResponse()` from `blocked.js` when page blocking occurs
- Store record_id globally for later updates
- Add error handling to prevent blocking failures if API is unavailable

**Phase 2:**
- Add reason input UI to blocked page (visible only after API call succeeds)
- Handle form submission with `updateRecordWithReason()`
- Show success/failure feedback to user
- Store pending reasons and retry if API is temporarily unavailable

## Enhanced Testing Requirements
**Phase 1 Testing:**
- [x] Test API call when website is blocked
- [x] Test with invalid API credentials
- [x] Test with network connectivity issues
- [x] Test that blocking still works even if API call fails
- [x] Test enable/disable functionality
- [x] Test with various URL formats

**Phase 2 Testing:**
- [ ] Test reason input UI appears after successful API call
- [ ] Test record update with user-provided reason
- [ ] Test reason submission with invalid record_id
- [ ] Test reason submission with empty reason
- [ ] Test reason submission when API is unavailable
- [ ] Test multiple reason submissions for same block
- [ ] Test reason input styling and responsiveness
- [ ] Test successful feedback display to user
- [ ] Test error handling and user notifications

## Dependencies
- No new external dependencies required
- Uses existing fetch API available in modern browsers
- Requires Chrome extension permissions for external API calls

## Security Considerations
- Store API token securely in Chrome storage
- Validate API endpoint URL to prevent malicious redirects
- Handle API errors gracefully without exposing sensitive data
- Consider adding rate limiting to prevent token abuse

## Impact Assessment
- **Performance**: Minimal impact (non-blocking API call)
- **Storage**: Small increase for API configuration storage
- **Privacy**: External API will receive blocked URLs (ensure user consent)
- **Compatibility**: Should work with existing blocking functionality

## Rollout Plan
1. Implement API configuration UI
2. Add API helper functions
3. Integrate API call into blocking logic
4. Add comprehensive error handling
5. Test various scenarios
6. Add documentation for users

## Enhanced Acceptance Criteria
**Phase 1 Criteria:**
- [x] User can configure API endpoint and token in options
- [x] API is called when website is blocked (if enabled)
- [x] Blocking continues to work even if API call fails
- [x] User can enable/disable API logging
- [x] Error handling is robust and doesn't affect core functionality
- [x] API configuration is stored securely

**Phase 2 Criteria:**
- [ ] User sees reason input form after successful API call
- [ ] User can enter and submit access reason
- [ ] Record is updated with user-provided reason in "备注" field
- [ ] User receives feedback on successful reason submission
- [ ] Reason submission fails gracefully if API is unavailable
- [ ] Multiple submissions for same record are handled correctly
- [ ] Reason input form has proper validation and styling
- [ ] Field names for website and remarks are configurable

## Notes
**Phase 1 Notes:**
- Default to disabled for privacy
- Clear documentation about what data is sent externally
- Consider adding data retention policies or user consent flows
- API call should be fire-and-forget (non-blocking)

**Phase 2 Notes:**
- Reason input should only appear after successful API record creation
- Record_id must be stored securely and temporarily
- Reason submission should be optional and not force user interaction
- User feedback should be clear and non-intrusive
- Consider adding character limits and validation for reason input
- Handle concurrent multiple blocks appropriately