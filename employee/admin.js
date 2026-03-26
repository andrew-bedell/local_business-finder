// === Operator Admin — Local Business Finder ===

(function () {
  'use strict';

  // ── Nav Groups ──
  const NAV_GROUPS = {
    pipeline: {
      items: [
        { label: 'navPipeline', tab: 'saved' }
      ],
      defaultTab: 'saved'
    },
    messaging: {
      items: [
        { label: 'navCampaigns', tab: 'campaigns' },
        { label: 'navAudiences', tab: 'audiences' },
        { label: 'navMessages', tab: 'messages' },
        { label: 'navEmail', tab: 'email' },
        { label: 'navTemplates', tab: 'templates' }
      ],
      defaultTab: 'campaigns'
    },
    customers: {
      items: [
        { label: 'navCustomers', tab: 'customers' },
        { label: 'navEditRequests', tab: 'edit_requests' },
        { label: 'navProducts', tab: 'products' }
      ],
      defaultTab: 'customers'
    },
    settings: {
      items: [
        { label: 'navTeam', tab: 'team', adminOnly: true },
        { label: 'langToggle', isLangToggle: true }
      ],
      defaultTab: 'team'
    }
  };

  // Reverse mapping: tab name → group name
  const TAB_TO_GROUP = {};
  Object.entries(NAV_GROUPS).forEach(function (entry) {
    var group = entry[0], config = entry[1];
    config.items.forEach(function (item) {
      if (item.tab) TAB_TO_GROUP[item.tab] = group;
    });
  });

  // ── i18n ──
  let currentLang = localStorage.getItem('app_lang') || 'en';

  const translations = {
    en: {
      adminTitle: 'Saved Businesses',
      adminTagline: 'View and manage all businesses saved to the database',
      navSearch: 'Search',
      navSaved: 'Saved',
      navPipeline: 'Pipeline',
      navGroupPipeline: 'Pipeline',
      navGroupMessaging: 'Messaging',
      navGroupCustomers: 'Customers',
      navGroupSettings: 'Settings',
      pipelineAll: 'All',
      pipelineSaved: 'Saved',
      pipelineLead: 'Leads',
      pipelineDemo: 'Demo',
      pipelineActive: 'Active',
      pipelineInactive: 'Inactive',
      pipelineSearchPlaceholder: 'Search by name, email, phone...',
      thStage: 'Stage',
      thCountry: 'Country',
      thContact: 'Contact Name',
      thContacts: 'Contacts',
      thContactPhone: 'Contact Phone',
      thContactWhatsapp: 'Contact WhatsApp',
      thContactEmail: 'Contact Email',
      thBusinessCode: 'ID',
      contactName: 'Contact Name',
      contactPhone: 'Contact Phone',
      contactEmail: 'Contact Email',
      contactTitle: 'Title / Role',
      contactNotes: 'Contact Notes',
      contactTitlePlaceholder: 'e.g. Owner, Manager, Cashier...',
      contactIsPrimary: 'Primary Contact',
      addContact: 'Add Contact',
      editContact: 'Edit Contact',
      deleteContact: 'Delete Contact',
      deleteContactConfirm: 'Delete this contact?',
      contactSaved: 'Contact saved',
      contactDeleted: 'Contact deleted',
      contactError: 'Failed to save contact',
      contactDeleteError: 'Failed to delete contact',
      noContacts: 'No contacts yet',
      contactsCount: '{0} contact(s)',
      businessNotes: 'Business Notes',
      businessNotesPlaceholder: 'Add notes about this business...',
      businessNotesSaved: 'Notes saved',
      pipelineStage: 'Pipeline Stage',
      pipelineContactSection: 'Contacts & Pipeline',
      pipelineChangeSuccess: 'Pipeline updated successfully',
      pipelineChangeError: 'Failed to update pipeline',
      inlineEditSaved: 'Saved',
      inlineEditError: 'Failed to save',
      clickToEdit: 'Click to edit',
      clickToAdd: 'Click to add',
      pipelineSaving: 'Saving...',
      pipelineSaveBtn: 'Save Pipeline Status',
      stageSaved: 'Saved',
      stageLead: 'Lead',
      stageDemo: 'Demo',
      stageActiveCustomer: 'Active',
      stageInactiveCustomer: 'Inactive',
      statTotal: 'Total Businesses',
      statLeads: 'Leads',
      statActiveCustomers: 'Active Customers',
      statWithWebsites: 'With Websites',
      filtersTitle: 'Filters',
      clearFilters: 'Clear Filters',
      applyFilters: 'Apply Filters',
      filterLocation: 'Location',
      filterLocationPlaceholder: 'City, state, or zip...',
      filterCountry: 'Country',
      filterAll: 'All',
      filterAny: 'Any',
      filterYes: 'Yes',
      filterNo: 'No',
      filterType: 'Business Type',
      filterMinRating: 'Min Rating',
      filterMinReviews: 'Min Reviews',
      filterHasInstagram: 'Has Instagram',
      filterMinPosts: 'Min IG Posts',
      filterHasFacebook: 'Has Facebook',
      filterHasReport: 'Has Report',
      filterHasWebsite: 'Has Website',
      adminResultsTitle: 'Saved Businesses',
      prevPage: 'Prev',
      nextPage: 'Next',
      pageInfo: 'Page {0} of {1}',
      showingCount: 'Showing {0} of {1} businesses',
      adminNoResults: 'No businesses match your filters.',
      adminFooter: 'Operator Admin — Local Business Finder',
      thName: 'Business Name',
      thLocation: 'Location',
      thType: 'Type',
      thPhone: 'Business Phone',
      thEmail: 'Business Email',
      thRating: 'Rating',
      thReviews: 'Reviews',
      thSocial: 'Social',
      thDetails: 'Details',
      thReport: 'Report',
      thAiPhotos: 'AI Photos',
      thWebsite: 'Website',
      thWebsiteUrl: 'URL',
      thEnrich: 'Enrich',
      thActions: 'Actions',
      thDelete: 'Delete',
      btnDelete: 'Delete',
      deleteConfirm: 'Are you sure you want to delete "{0}"? This cannot be undone.',
      deleteSuccess: '"{0}" has been deleted.',
      deleteError: 'Failed to delete business. It may have related records.',
      bulkEnrich: 'Enrich Selected',
      bulkDelete: 'Delete Selected',
      bulkClear: 'Clear Selection',
      bulkSelected: '{0} selected',
      bulkDeleteConfirm: 'Are you sure you want to delete {0} businesses? This cannot be undone.',
      bulkDeleteSuccess: 'Deleted {0} businesses.',
      bulkEnrichSuccess: 'Enrichment started for {0} businesses.',
      viewBtn: 'View',
      badgeYes: 'Yes',
      badgeNo: '—',
      btnEnrich: 'Enrich',
      enriching: 'Enriching...',
      enrichSuccess: 'Enrichment complete for {0}',
      enrichError: 'Enrichment failed. Please try again.',
      enrichNoPlaceId: 'No Google place ID — cannot enrich',
      btnReport: 'Report',
      btnPhotos: 'Generate Photos',
      generatingPhotos: 'Generating...',
      photosSuccess: 'AI photos generated for {0}',
      photosError: 'Failed to generate photos. Please try again.',
      photosNoneNeeded: 'All photos are existing — no AI generation needed',
      needsPhotos: 'Generate photos first',
      btnWebsite: 'Website',
      reportSuccess: 'Research report generated for {0}',
      websiteSuccess: 'Website generated for {0}',
      needsReport: 'Generate report first to see photo plan',
      noData: 'No Data',
      // Modal detail sections
      modalDescription: 'Description',
      modalServiceOptions: 'Service Options',
      modalHighlights: 'Highlights',
      modalAmenities: 'Amenities',
      modalAccessibility: 'Accessibility',
      modalReviewBreakdown: 'Review Breakdown',
      topPick: 'Top Pick',
      good: 'Good',
      topReviewsTitle: 'Top Reviews',
      topReviewsSubtitle: 'Best reviews selected by sentiment analysis',
      noReviewsAvailable: 'No reviews available',
      copyTopReviews: 'Copy Top Reviews',
      closeBtn: 'Close',
      facebookProfile: 'Facebook Profile',
      instagramProfile: 'Instagram Profile',
      followers: '{0} followers',
      viewOnFacebook: 'View on Facebook',
      fbReactions: 'reactions',
      fbReviewsTitle: 'Facebook Reviews ({0})',
      igPosts: 'posts',
      igFollowers: 'followers',
      igFollowing: 'following',
      igVerified: 'Verified account',
      priceRange: 'Price Range',
      anonymous: 'Anonymous',
      reviews: 'reviews',
      noReviews: 'No reviews',
      badgeDraft: 'Draft',
      badgePublished: 'Published',
      loadingData: 'Loading...',
      errorLoading: 'Failed to load data. Please refresh.',
      // Detail modal
      modalClose: 'Close',
      modalBusinessDetails: 'Business Details',
      modalAddress: 'Address',
      modalPhone: 'Phone',
      modalRating: 'Rating',
      modalReviews: 'Reviews',
      modalHours: 'Business Hours',
      modalTypes: 'Categories',
      modalSocialProfiles: 'Social Profiles',
      modalPhotos: 'Photos',
      modalGoogleReviews: 'Google Reviews',
      modalFacebookReviews: 'Facebook Reviews',
      // Research report
      generateReport: 'Generate Research Report',
      generatingReport: 'Generating report...',
      reportGenerating: 'Analyzing business data and generating website content report. This may take up to 30 seconds...',
      reportError: 'Failed to generate research report. Please try again.',
      // Pipeline progress popup
      pipelineTitle: 'Generating for {0}',
      pipelineStepReport: 'Research Report',
      pipelineStepPhotos: 'AI Photos',
      pipelineStepWebsite: 'Website',
      pipelineStatusPending: 'Pending',
      pipelineStatusRunning: 'In progress...',
      pipelineStatusDone: 'Complete',
      pipelineStatusError: 'Failed',
      pipelineClose: 'Close',
      reportBusinessSummary: 'Business Summary',
      reportSellingPoints: 'Key Selling Points',
      reportReviewHighlights: 'Review Highlights',
      reportReviewThemes: 'Recurring Themes',
      reportQuotableReviews: 'Best Quotes for Website',
      reportAreasToAvoid: 'Topics to Avoid',
      reportSuggestedSections: 'Suggested Website Sections',
      reportToneRec: 'Tone & Writing Style',
      reportOverallTone: 'Overall Tone',
      reportWritingStyle: 'Writing Style',
      reportWordsToUse: 'Vocabulary to Use',
      reportWordsToAvoid: 'Vocabulary to Avoid',
      reportCompetitive: 'Competitive Positioning',
      reportContentGaps: 'Content Gaps',
      reportSocialInsights: 'Social Media Insights',
      reportSeoKeywords: 'Local SEO Keywords',
      reportPriorityHigh: 'High',
      reportPriorityMedium: 'Medium',
      reportPriorityLow: 'Low',
      reportPhotoAssetPlan: 'Photo & Asset Plan',
      reportPhotoExisting: 'Use Existing',
      reportPhotoGenerate: 'AI Generate',
      reportPhotoSource: 'Photo ID',
      reportPhotoPrompt: 'AI Prompt',
      // Website generation
      generateWebsite: 'Generate Website',
      generatingWebsite: 'Generating...',
      websiteGenTitle: 'Website Generation',
      websiteGenerating: 'Generating a complete website using AI. This may take up to 60 seconds...',
      websiteError: 'Failed to generate website. Please try again.',
      websiteDownload: 'Download HTML',
      websiteOpenNewTab: 'Open in New Tab',
      websiteSaved: 'Website saved to database',
      timeoutError: '{0} timed out after {1}s.',
      // Audiences & Campaigns
      navAudiences: 'Audiences',
      navCampaigns: 'Campaigns',
      audiencesTitle: 'Audiences',
      audienceCreate: 'Create Audience',
      audiencesEmpty: 'No audiences created yet. Create one to start targeting businesses.',
      audienceNew: 'New Audience',
      audienceEdit: 'Edit Audience',
      audienceName: 'Audience Name',
      audienceNamePh: 'e.g. Restaurants in Merida',
      audienceDesc: 'Description (optional)',
      audienceDescPh: 'Short description of this audience',
      audienceFilters: 'Filters',
      audienceFilterCategory: 'Category',
      audienceFilterCategoryPh: 'e.g. restaurant, salon',
      audienceFilterRatingMin: 'Rating Min',
      audienceFilterRatingMax: 'Rating Max',
      audienceFilterMsgSentMin: 'Msgs Sent Min',
      audienceFilterMsgSentMax: 'Msgs Sent Max',
      audienceFilterRepliesMin: 'Replies Min',
      audienceFilterRepliesMax: 'Replies Max',
      audienceFilterNeverContacted: 'Never Contacted',
      audienceFilterLastContactAfter: 'Last Contact After',
      audiencePreview: 'Preview Audience',
      audiencePreviewCount: '{0} businesses match',
      audienceSave: 'Save Audience',
      audienceDeleteConfirm: 'Delete this audience?',
      audienceDeleted: 'Audience deleted',
      audienceSaved: 'Audience saved',
      filterCity: 'City',
      filterState: 'State',
      cancel: 'Cancel',
      campaignsTitle: 'Campaigns',
      campaignCreate: 'New Campaign',
      campaignsEmpty: 'No campaigns yet. Create one to start messaging your audience.',
      campaignNew: 'New Campaign',
      campaignEdit: 'Edit Campaign',
      campaignName: 'Campaign Name',
      campaignNamePh: 'e.g. March outreach - restaurants',
      campaignAudience: 'Target Audience',
      campaignSelectAudience: 'Select audience...',
      campaignTemplate: 'WhatsApp Template',
      campaignSelectTemplate: 'Select template...',
      campaignSchedule: 'Schedule (optional)',
      campaignSaveDraft: 'Save as Draft',
      campaignSendNow: 'Send Now',
      campaignSending: 'Sending...',
      campaignSaved: 'Campaign saved',
      campaignCancelled: 'Campaign cancelled',
      campaignSendConfirm: 'Send this campaign to {0} businesses now?',
      campaignSendStarted: 'Campaign send started',
      campaignSendComplete: 'Campaign sent to all recipients',
      campaignSendError: 'Campaign send error',
      backToCampaigns: 'Back to Campaigns',
      campaignStatTotal: 'Total',
      campaignStatSent: 'Sent',
      campaignStatDelivered: 'Delivered',
      campaignStatRead: 'Read',
      campaignStatReplied: 'Replied',
      campaignStatFailed: 'Failed',
      // WhatsApp messaging
      navMessages: 'Chats',
      msgConversations: 'Conversations',
      msgSearchPlaceholder: 'Search businesses...',
      msgSelectConversation: 'Select a conversation to start messaging',
      msgSend: 'Send',
      msgSendTemplate: 'Send Template',
      msgPlaceholder: 'Type a message...',
      msgWindowOpen: '24h window open',
      msgWindowClosed: 'Window closed',
      msgTemplateRequired: 'Use a template to start a conversation',
      msgNoConversations: 'No conversations yet',
      msgTemplateSelect: 'Select template...',
      msgTemplateParam: 'Parameter {0}',
      msgSending: 'Sending...',
      msgSendError: 'Failed to send message',
      msgSendSuccess: 'Message sent',
      msgSyncTemplates: 'Syncing templates...',
      msgSyncSuccess: 'Templates synced',
      msgSyncError: 'Failed to sync templates',
      msgBtnLabel: 'Msg',
      msgNoPhone: 'No phone number available for this business',
      msgStatusSent: 'Sent',
      msgStatusDelivered: 'Delivered',
      msgStatusRead: 'Read',
      msgStatusFailed: 'Failed',
      msgToday: 'Today',
      msgYesterday: 'Yesterday',
      // Products
      navProducts: 'Products',
      productsTitle: 'Products',
      productCreate: 'New Product',
      productsEmpty: 'No products yet. Create one to start selling.',
      productNew: 'New Product',
      productEdit: 'Edit Product',
      productName: 'Product Name',
      productNamePh: 'e.g. Monthly Website Plan',
      productPrice: 'Price',
      productCurrency: 'Currency',
      productInterval: 'Billing Interval',
      productMonthly: 'Monthly',
      productYearly: 'Yearly',
      productOneTime: 'One Time',
      productDescription: 'Description',
      productDescPh: 'Brief description of this product',
      productFeatures: 'Features (one per line)',
      productFeaturesPh: 'Custom website design\nMobile responsive\nMonthly updates\n24/7 support',
      productStripeProductId: 'Stripe Product ID',
      productStripePriceId: 'Stripe Price ID',
      productSortOrder: 'Sort Order',
      productActive: 'Active',
      productSave: 'Save Product',
      productSaved: 'Product saved',
      productDeleteConfirm: 'Delete this product?',
      productDeleted: 'Product deleted',
      productPerMonth: '{0}/mo',
      productPerYear: '{0}/yr',
      // Preview links
      websiteCopyLink: 'Copy Preview Link',
      websiteSendWhatsApp: 'Send via WhatsApp',
      websiteLinkCopied: 'Preview link copied to clipboard',
      // Website lifecycle
      websitePublish: 'Publish',
      websiteUnpublish: 'Unpublish',
      websiteSuspend: 'Suspend',
      websiteReactivate: 'Reactivate',
      websiteCopyLiveUrl: 'Copy Live URL',
      websitePublished: 'Website published',
      websiteUnpublished: 'Website unpublished',
      websiteSuspended: 'Website suspended',
      websiteReactivated: 'Website reactivated',
      websiteLiveUrlCopied: 'Live URL copied to clipboard',
      websitePublishError: 'Failed to update website status',
      websiteStatusDraft: 'Draft',
      websiteStatusPublished: 'Published',
      websiteStatusSuspended: 'Suspended',
      websiteStatusActive: 'Active',
      // Website & Domain (in customer detail)
      custWebsiteSection: 'Website',
      custWebsiteStatus: 'Site Status',
      custPublishedUrl: 'Published URL',
      custWebsiteVersion: 'Version',
      custDomainSection: 'Custom Domain',
      custDomainNone: 'No custom domain',
      custDomainAdd: 'Add Domain',
      custDomainAdding: 'Adding...',
      custDomainPlaceholder: 'www.theirbusiness.com',
      custDomainVerify: 'Verify',
      custDomainVerifying: 'Verifying...',
      custDomainRemove: 'Remove',
      custDomainRemoving: 'Removing...',
      custDomainAdded: 'Domain added — awaiting DNS verification',
      custDomainVerified: 'Domain verified',
      custDomainPending: 'Pending verification',
      custDomainFailed: 'Verification failed — check DNS',
      custDomainRemoved: 'Domain removed',
      custDomainError: 'Domain operation failed',
      custDnsCname: 'CNAME',
      custDnsValue: 'cname.vercel-dns.com',
      custDnsInstructions: 'Add this DNS record at the domain registrar:',
      custStatusPublished: 'Published',
      custStatusDraft: 'Draft',
      custStatusSuspended: 'Suspended',
      custNoWebsite: 'No website generated yet',
      // Customers
      navCustomers: 'Customers',
      customersTitle: 'Customers',
      customersSearchPh: 'Search customers...',
      customersEmpty: 'No customers yet. Customers will appear here when they purchase a website.',
      customersStatusActive: 'Active',
      customersStatusPastDue: 'Past Due',
      customersStatusCancelled: 'Cancelled',
      customersStatusIncomplete: 'Incomplete',
      custColBusiness: 'Business',
      custColContact: 'Contact',
      custColEmail: 'Email',
      custColPhone: 'Phone',
      custColPlan: 'Plan',
      custColDemoUrl: 'Demo Website',
      custColLiveUrl: 'Published URL',
      custColPurchased: 'Domain Purchased',
      custColStatus: 'Status',
      custColSince: 'Since',
      custColActions: 'Actions',
      backToCustomers: 'Back to Customers',
      custView: 'View',
      custTotalCustomers: '{0} customers',
      custActiveCount: '{0} active',
      custMrr: 'MRR: {0}',
      custDetailBusiness: 'Business Information',
      custDetailContact: 'Contact Information',
      custDetailSubscription: 'Subscription',
      custDetailNotes: 'Notes',
      custNotesSave: 'Save Notes',
      custNotesSaved: 'Notes saved',
      custNoSubscription: 'No subscription',
      custWhatsApp: 'WhatsApp',
      custPortalLink: 'Customer Portal',
      custWebsite: 'Website',
      custCategory: 'Category',
      custAddress: 'Address',
      custRating: 'Rating',
      custPipeline: 'Pipeline',
      custStripeId: 'Stripe ID',
      custBillingPeriod: 'Billing Period',
      // Report & AI Photos modals
      reportModalTitle: 'Research Report',
      aiPhotosModalTitle: 'AI Generated Photos',
      aiPhotosEmpty: 'No AI photos generated yet',
      aiPhotosSection: 'Section',
      regenerateReport: 'Regenerate Report',
      regeneratePhotos: 'Regenerate Photos',
      regenerateWebsite: 'Regenerate Website',
      regeneratingReport: 'Regenerating…',
      regeneratingPhotos: 'Regenerating…',
      openWebsite: 'Open Website',
      // Edit Requests management
      navEditRequests: 'Edit Requests',
      erAllStatuses: 'All Statuses',
      erAllPriorities: 'All Priorities',
      erSearchPh: 'Search requests...',
      erEmpty: 'No edit requests yet',
      erBack: '← Back to list',
      erDetailTitle: 'Edit Request',
      erColDate: 'Date',
      erColBusiness: 'Business',
      erColType: 'Type',
      erColDescription: 'Description',
      erColPriority: 'Priority',
      erColStatus: 'Status',
      erColActions: 'Actions',
      erStatusSubmitted: 'Submitted',
      erStatusProcessing: 'Processing',
      erStatusInReview: 'In Review',
      erStatusInProgress: 'In Progress',
      erStatusReadyForReview: 'Ready for Review',
      erStatusCompleted: 'Completed',
      erStatusRejected: 'Rejected',
      erStatusCustomerRejected: 'Customer Rejected',
      erPriorityLow: 'Low',
      erPriorityNormal: 'Normal',
      erPriorityHigh: 'High',
      erPriorityUrgent: 'Urgent',
      erTypeContent: 'Content Update',
      erTypePhoto: 'Photo Update',
      erTypeContact: 'Contact Update',
      erTypeHours: 'Hours Update',
      erTypeMenu: 'Menu Update',
      erTypeDesign: 'Design Change',
      erTypeOther: 'Other',
      erView: 'View',
      erUpdateStatus: 'Update Status',
      erAdminNotes: 'Admin Notes',
      erSaveNotes: 'Save Notes',
      erRejectionReason: 'Rejection Reason',
      erElementInfo: 'Element Info',
      erAiConversation: 'AI Conversation',
      erCustomer: 'Customer',
      erStatsTotal: 'Total: {0}',
      erStatsOpen: 'Open: {0}',
      // Team management
      navTeam: 'Team',
      teamEmail: 'Email',
      teamName: 'Name',
      teamRole: 'Role',
      teamStatus: 'Status',
      teamJoined: 'Joined',
      teamActions: 'Actions',
      teamInvite: 'Invite Employee',
      teamInviting: 'Sending…',
      teamInviteSuccess: 'Invitation sent to {0}',
      teamInviteError: 'Failed to send invitation',
      teamDeactivate: 'Deactivate',
      teamActivate: 'Activate',
      teamResend: 'Resend',
      teamResending: 'Sending…',
      teamResendSuccess: 'Invitation resent to {0}',
      teamResendError: 'Failed to resend invitation',
      teamRoleAdmin: 'Admin',
      teamRoleEmployee: 'Employee',
      teamStatusActive: 'Active',
      teamStatusInactive: 'Inactive',
      teamStatusPending: 'Pending',
      teamNoEmployees: 'No team members yet. Invite your first employee above.',
      teamLoadError: 'Failed to load team members',
      teamUpdateSuccess: 'Employee updated',
      teamUpdateError: 'Failed to update employee',
      // Email
      navEmail: 'Email',
      emailCustomerEmails: 'Customer Emails',
      emailInbox: 'Inbox',
      emailCompose: 'Compose',
      emailSearchPlaceholder: 'Search emails...',
      emailSelectConversation: 'Select a conversation to view emails',
      emailNoConversations: 'No email conversations yet',
      emailComposeTitle: 'New Email',
      emailTo: 'To',
      emailSubject: 'Subject',
      emailBody: 'Body',
      emailSendBtn: 'Send Email',
      emailSending: 'Sending...',
      emailSent: 'Email sent',
      emailSendError: 'Failed to send email',
      emailReplyPlaceholder: 'Write a reply...',
      emailReplySubjectPh: 'Subject',
      emailReply: 'Reply',
      emailAttachments: '{0} attachment(s)',
      // Templates
      navTemplates: 'Templates',
      templatesTitle: 'Email Templates',
      templatesNew: 'New Template',
      templatesEmpty: 'No email templates yet.',
      templatesSeed: 'Seed Default Templates',
      templatesFlowsTitle: 'Automation Flows',
      templatesBack: '\u2190 Back',
      templatesNamePh: 'Template name...',
      templatesVisual: 'Visual',
      templatesHtml: 'HTML',
      templatesPreview: 'Preview',
      templatesTest: 'Send Test',
      templatesSave: 'Save',
      templatesSubject: 'Subject Line',
      templatesCategory: 'Category',
      templatesCatTransactional: 'Transactional',
      templatesCatMarketing: 'Marketing',
      templatesCatCustom: 'Custom',
      templatesTrigger: 'Trigger Event',
      templatesDescription: 'Description',
      templatesMergeTags: 'Merge Tags',
      templatesPreviewTitle: 'Template Preview',
      templatesDesktop: 'Desktop',
      templatesMobile: 'Mobile',
      templatesSendTest: 'Send Test Email',
      templatesSendTestBtn: 'Send Test',
      templatesSaved: 'Template saved',
      templatesSaveError: 'Failed to save template',
      templatesDeleted: 'Template deleted',
      templatesDeleteError: 'Failed to delete template',
      templatesDuplicated: 'Template duplicated',
      templatesDuplicateError: 'Failed to duplicate template',
      templatesSeeded: 'Default templates created',
      templatesSeedError: 'Failed to seed templates',
      templatesTestSent: 'Test email sent',
      templatesTestError: 'Failed to send test email',
      templatesConfirmDelete: 'Delete this template?',
      templatesFlowLinked: 'Linked: {0}',
      templatesFlowNotLinked: 'Not linked',
      templatesTriggerNone: 'None',
    },
    es: {
      adminTitle: 'Negocios Guardados',
      adminTagline: 'Ver y gestionar todos los negocios guardados en la base de datos',
      navSearch: 'Buscar',
      navSaved: 'Guardados',
      navPipeline: 'Pipeline',
      navGroupPipeline: 'Pipeline',
      navGroupMessaging: 'Mensajes',
      navGroupCustomers: 'Clientes',
      navGroupSettings: 'Ajustes',
      pipelineAll: 'Todos',
      pipelineSaved: 'Guardados',
      pipelineLead: 'Leads',
      pipelineDemo: 'Demo',
      pipelineActive: 'Activos',
      pipelineInactive: 'Inactivos',
      pipelineSearchPlaceholder: 'Buscar por nombre, email, teléfono...',
      thStage: 'Etapa',
      thCountry: 'País',
      thContact: 'Nombre de Contacto',
      thContacts: 'Contactos',
      thContactPhone: 'Tel. Contacto',
      thContactWhatsapp: 'WhatsApp de Contacto',
      thContactEmail: 'Correo de Contacto',
      thBusinessCode: 'ID',
      contactName: 'Nombre de Contacto',
      contactPhone: 'Teléfono de Contacto',
      contactEmail: 'Correo de Contacto',
      contactTitle: 'Título / Rol',
      contactNotes: 'Notas del Contacto',
      contactTitlePlaceholder: 'ej. Dueño, Gerente, Cajero...',
      contactIsPrimary: 'Contacto Principal',
      addContact: 'Agregar Contacto',
      editContact: 'Editar Contacto',
      deleteContact: 'Eliminar Contacto',
      deleteContactConfirm: '¿Eliminar este contacto?',
      contactSaved: 'Contacto guardado',
      contactDeleted: 'Contacto eliminado',
      contactError: 'Error al guardar contacto',
      contactDeleteError: 'Error al eliminar contacto',
      noContacts: 'Sin contactos',
      contactsCount: '{0} contacto(s)',
      businessNotes: 'Notas del Negocio',
      businessNotesPlaceholder: 'Agregar notas sobre este negocio...',
      businessNotesSaved: 'Notas guardadas',
      pipelineStage: 'Etapa del Pipeline',
      pipelineContactSection: 'Contactos y Pipeline',
      pipelineChangeSuccess: 'Pipeline actualizado exitosamente',
      pipelineChangeError: 'Error al actualizar pipeline',
      inlineEditSaved: 'Guardado',
      inlineEditError: 'Error al guardar',
      clickToEdit: 'Clic para editar',
      clickToAdd: 'Clic para agregar',
      pipelineSaving: 'Guardando...',
      pipelineSaveBtn: 'Guardar Etapa',
      stageSaved: 'Guardado',
      stageLead: 'Lead',
      stageDemo: 'Demo',
      stageActiveCustomer: 'Activo',
      stageInactiveCustomer: 'Inactivo',
      statTotal: 'Total Negocios',
      statLeads: 'Leads',
      statActiveCustomers: 'Clientes Activos',
      statWithWebsites: 'Con Sitios Web',
      filtersTitle: 'Filtros',
      clearFilters: 'Limpiar Filtros',
      applyFilters: 'Aplicar Filtros',
      filterLocation: 'Ubicación',
      filterLocationPlaceholder: 'Ciudad, estado o código postal...',
      filterCountry: 'País',
      filterAll: 'Todos',
      filterAny: 'Cualquiera',
      filterYes: 'Sí',
      filterNo: 'No',
      filterType: 'Tipo de Negocio',
      filterMinRating: 'Calificación Mín.',
      filterMinReviews: 'Reseñas Mín.',
      filterHasInstagram: 'Tiene Instagram',
      filterMinPosts: 'Posts IG Mín.',
      filterHasFacebook: 'Tiene Facebook',
      filterHasReport: 'Tiene Informe',
      filterHasWebsite: 'Tiene Sitio Web',
      adminResultsTitle: 'Negocios Guardados',
      prevPage: 'Anterior',
      nextPage: 'Siguiente',
      pageInfo: 'Página {0} de {1}',
      showingCount: 'Mostrando {0} de {1} negocios',
      adminNoResults: 'Ningún negocio coincide con los filtros.',
      adminFooter: 'Admin del Operador — Buscador de Negocios Locales',
      thName: 'Nombre',
      thLocation: 'Ubicación',
      thType: 'Tipo',
      thPhone: 'Tel. Negocio',
      thEmail: 'Email Negocio',
      thRating: 'Calificación',
      thReviews: 'Reseñas',
      thSocial: 'Social',
      thDetails: 'Detalles',
      thReport: 'Informe',
      thAiPhotos: 'Fotos IA',
      thWebsite: 'Sitio Web',
      thWebsiteUrl: 'URL',
      thEnrich: 'Enriquecer',
      thActions: 'Acciones',
      thDelete: 'Eliminar',
      btnDelete: 'Eliminar',
      deleteConfirm: '¿Estás seguro de que quieres eliminar "{0}"? Esta acción no se puede deshacer.',
      deleteSuccess: '"{0}" ha sido eliminado.',
      deleteError: 'No se pudo eliminar el negocio. Puede tener registros relacionados.',
      bulkEnrich: 'Enriquecer Seleccionados',
      bulkDelete: 'Eliminar Seleccionados',
      bulkClear: 'Limpiar Selección',
      bulkSelected: '{0} seleccionados',
      bulkDeleteConfirm: '¿Estás seguro de que quieres eliminar {0} negocios? Esta acción no se puede deshacer.',
      bulkDeleteSuccess: '{0} negocios eliminados.',
      bulkEnrichSuccess: 'Enriquecimiento iniciado para {0} negocios.',
      viewBtn: 'Ver',
      badgeYes: 'Sí',
      badgeNo: '—',
      btnEnrich: 'Enriquecer',
      enriching: 'Enriqueciendo...',
      enrichSuccess: 'Enriquecimiento completo para {0}',
      enrichError: 'Error al enriquecer. Por favor intente de nuevo.',
      enrichNoPlaceId: 'Sin Google place ID — no se puede enriquecer',
      btnReport: 'Informe',
      btnPhotos: 'Generar Fotos',
      generatingPhotos: 'Generando...',
      photosSuccess: 'Fotos IA generadas para {0}',
      photosError: 'Error al generar fotos. Por favor intente de nuevo.',
      photosNoneNeeded: 'Todas las fotos son existentes — no se necesita generación IA',
      needsPhotos: 'Genera las fotos primero',
      btnWebsite: 'Sitio',
      reportSuccess: 'Informe generado para {0}',
      websiteSuccess: 'Sitio web generado para {0}',
      needsReport: 'Genera el informe primero para ver el plan de fotos',
      noData: 'Sin Datos',
      modalDescription: 'Descripción',
      modalServiceOptions: 'Opciones de Servicio',
      modalHighlights: 'Destacados',
      modalAmenities: 'Comodidades',
      modalAccessibility: 'Accesibilidad',
      modalReviewBreakdown: 'Desglose de Reseñas',
      topPick: 'Top',
      good: 'Bueno',
      topReviewsTitle: 'Mejores Reseñas',
      topReviewsSubtitle: 'Mejores reseñas seleccionadas por análisis de sentimiento',
      noReviewsAvailable: 'No hay reseñas disponibles',
      copyTopReviews: 'Copiar Mejores Reseñas',
      closeBtn: 'Cerrar',
      facebookProfile: 'Perfil de Facebook',
      instagramProfile: 'Perfil de Instagram',
      followers: '{0} seguidores',
      viewOnFacebook: 'Ver en Facebook',
      fbReactions: 'reacciones',
      fbReviewsTitle: 'Reseñas de Facebook ({0})',
      igPosts: 'publicaciones',
      igFollowers: 'seguidores',
      igFollowing: 'siguiendo',
      igVerified: 'Cuenta verificada',
      priceRange: 'Rango de Precio',
      anonymous: 'Anónimo',
      reviews: 'reseñas',
      noReviews: 'Sin reseñas',
      badgeDraft: 'Borrador',
      badgePublished: 'Publicado',
      loadingData: 'Cargando...',
      errorLoading: 'Error al cargar datos. Por favor recargue.',
      modalClose: 'Cerrar',
      modalBusinessDetails: 'Detalles del Negocio',
      modalAddress: 'Dirección',
      modalPhone: 'Teléfono',
      modalRating: 'Calificación',
      modalReviews: 'Reseñas',
      modalHours: 'Horario',
      modalTypes: 'Categorías',
      modalSocialProfiles: 'Perfiles Sociales',
      modalPhotos: 'Fotos',
      modalGoogleReviews: 'Reseñas de Google',
      modalFacebookReviews: 'Reseñas de Facebook',
      generateReport: 'Generar Informe de Investigación',
      generatingReport: 'Generando informe...',
      reportGenerating: 'Analizando datos del negocio y generando informe. Esto puede tardar hasta 30 segundos...',
      reportError: 'Error al generar el informe. Intente de nuevo.',
      // Pipeline progress popup
      pipelineTitle: 'Generando para {0}',
      pipelineStepReport: 'Informe de Investigación',
      pipelineStepPhotos: 'Fotos AI',
      pipelineStepWebsite: 'Sitio Web',
      pipelineStatusPending: 'Pendiente',
      pipelineStatusRunning: 'En progreso...',
      pipelineStatusDone: 'Completado',
      pipelineStatusError: 'Error',
      pipelineClose: 'Cerrar',
      reportBusinessSummary: 'Resumen del Negocio',
      reportSellingPoints: 'Puntos de Venta Clave',
      reportReviewHighlights: 'Destacados de Reseñas',
      reportReviewThemes: 'Temas Recurrentes',
      reportQuotableReviews: 'Mejores Citas para el Sitio Web',
      reportAreasToAvoid: 'Temas a Evitar',
      reportSuggestedSections: 'Secciones Sugeridas',
      reportToneRec: 'Tono y Estilo de Escritura',
      reportOverallTone: 'Tono General',
      reportWritingStyle: 'Estilo de Escritura',
      reportWordsToUse: 'Vocabulario a Usar',
      reportWordsToAvoid: 'Vocabulario a Evitar',
      reportCompetitive: 'Posicionamiento Competitivo',
      reportContentGaps: 'Brechas de Contenido',
      reportSocialInsights: 'Perspectivas de Redes Sociales',
      reportSeoKeywords: 'Palabras Clave SEO Local',
      reportPriorityHigh: 'Alta',
      reportPriorityMedium: 'Media',
      reportPriorityLow: 'Baja',
      reportPhotoAssetPlan: 'Plan de Fotos y Activos',
      reportPhotoExisting: 'Usar Existente',
      reportPhotoGenerate: 'Generar con IA',
      reportPhotoSource: 'ID de Foto',
      reportPhotoPrompt: 'Prompt IA',
      generateWebsite: 'Generar Sitio Web',
      generatingWebsite: 'Generando...',
      websiteGenTitle: 'Generación de Sitio Web',
      websiteGenerating: 'Generando un sitio web completo con IA. Esto puede tardar hasta 60 segundos...',
      websiteError: 'Error al generar el sitio web. Intente de nuevo.',
      websiteDownload: 'Descargar HTML',
      websiteOpenNewTab: 'Abrir en Nueva Pestaña',
      websiteSaved: 'Sitio web guardado en la base de datos',
      timeoutError: '{0} agotó el tiempo después de {1}s.',
      // Audiences & Campaigns
      navAudiences: 'Audiencias',
      navCampaigns: 'Campañas',
      audiencesTitle: 'Audiencias',
      audienceCreate: 'Crear Audiencia',
      audiencesEmpty: 'No hay audiencias creadas. Crea una para empezar a segmentar negocios.',
      audienceNew: 'Nueva Audiencia',
      audienceEdit: 'Editar Audiencia',
      audienceName: 'Nombre de Audiencia',
      audienceNamePh: 'Ej: Restaurantes en Mérida',
      audienceDesc: 'Descripción (opcional)',
      audienceDescPh: 'Descripción corta de esta audiencia',
      audienceFilters: 'Filtros',
      audienceFilterCategory: 'Categoría',
      audienceFilterCategoryPh: 'Ej: restaurante, salón',
      audienceFilterRatingMin: 'Calificación Mín',
      audienceFilterRatingMax: 'Calificación Máx',
      audienceFilterMsgSentMin: 'Msgs Enviados Mín',
      audienceFilterMsgSentMax: 'Msgs Enviados Máx',
      audienceFilterRepliesMin: 'Respuestas Mín',
      audienceFilterRepliesMax: 'Respuestas Máx',
      audienceFilterNeverContacted: 'Nunca Contactado',
      audienceFilterLastContactAfter: 'Último Contacto Después',
      audiencePreview: 'Vista Previa',
      audiencePreviewCount: '{0} negocios coinciden',
      audienceSave: 'Guardar Audiencia',
      audienceDeleteConfirm: '¿Eliminar esta audiencia?',
      audienceDeleted: 'Audiencia eliminada',
      audienceSaved: 'Audiencia guardada',
      filterCity: 'Ciudad',
      filterState: 'Estado',
      cancel: 'Cancelar',
      campaignsTitle: 'Campañas',
      campaignCreate: 'Nueva Campaña',
      campaignsEmpty: 'No hay campañas. Crea una para empezar a enviar mensajes.',
      campaignNew: 'Nueva Campaña',
      campaignEdit: 'Editar Campaña',
      campaignName: 'Nombre de Campaña',
      campaignNamePh: 'Ej: Alcance marzo - restaurantes',
      campaignAudience: 'Audiencia Objetivo',
      campaignSelectAudience: 'Seleccionar audiencia...',
      campaignTemplate: 'Plantilla de WhatsApp',
      campaignSelectTemplate: 'Seleccionar plantilla...',
      campaignSchedule: 'Programar (opcional)',
      campaignSaveDraft: 'Guardar Borrador',
      campaignSendNow: 'Enviar Ahora',
      campaignSending: 'Enviando...',
      campaignSaved: 'Campaña guardada',
      campaignCancelled: 'Campaña cancelada',
      campaignSendConfirm: '¿Enviar esta campaña a {0} negocios ahora?',
      campaignSendStarted: 'Envío de campaña iniciado',
      campaignSendComplete: 'Campaña enviada a todos los destinatarios',
      campaignSendError: 'Error al enviar campaña',
      backToCampaigns: 'Volver a Campañas',
      campaignStatTotal: 'Total',
      campaignStatSent: 'Enviados',
      campaignStatDelivered: 'Entregados',
      campaignStatRead: 'Leídos',
      campaignStatReplied: 'Respondidos',
      campaignStatFailed: 'Fallidos',
      // WhatsApp messaging
      navMessages: 'Chats',
      msgConversations: 'Conversaciones',
      msgSearchPlaceholder: 'Buscar negocios...',
      msgSelectConversation: 'Seleccione una conversación para enviar mensajes',
      msgSend: 'Enviar',
      msgSendTemplate: 'Enviar Plantilla',
      msgPlaceholder: 'Escribe un mensaje...',
      msgWindowOpen: 'Ventana 24h abierta',
      msgWindowClosed: 'Ventana cerrada',
      msgTemplateRequired: 'Use una plantilla para iniciar una conversación',
      msgNoConversations: 'Sin conversaciones aún',
      msgTemplateSelect: 'Seleccionar plantilla...',
      msgTemplateParam: 'Parámetro {0}',
      msgSending: 'Enviando...',
      msgSendError: 'Error al enviar mensaje',
      msgSendSuccess: 'Mensaje enviado',
      msgSyncTemplates: 'Sincronizando plantillas...',
      msgSyncSuccess: 'Plantillas sincronizadas',
      msgSyncError: 'Error al sincronizar plantillas',
      msgBtnLabel: 'Msg',
      msgNoPhone: 'No hay número de teléfono para este negocio',
      msgStatusSent: 'Enviado',
      msgStatusDelivered: 'Entregado',
      msgStatusRead: 'Leído',
      msgStatusFailed: 'Fallido',
      msgToday: 'Hoy',
      msgYesterday: 'Ayer',
      // Products
      navProducts: 'Productos',
      productsTitle: 'Productos',
      productCreate: 'Nuevo Producto',
      productsEmpty: 'No hay productos. Crea uno para empezar a vender.',
      productNew: 'Nuevo Producto',
      productEdit: 'Editar Producto',
      productName: 'Nombre del Producto',
      productNamePh: 'Ej: Plan Mensual Sitio Web',
      productPrice: 'Precio',
      productCurrency: 'Moneda',
      productInterval: 'Intervalo de Cobro',
      productMonthly: 'Mensual',
      productYearly: 'Anual',
      productOneTime: 'Único',
      productDescription: 'Descripción',
      productDescPh: 'Descripción breve del producto',
      productFeatures: 'Características (una por línea)',
      productFeaturesPh: 'Diseño de sitio web personalizado\nAdaptable a móviles\nActualizaciones mensuales\nSoporte 24/7',
      productStripeProductId: 'Stripe Product ID',
      productStripePriceId: 'Stripe Price ID',
      productSortOrder: 'Orden',
      productActive: 'Activo',
      productSave: 'Guardar Producto',
      productSaved: 'Producto guardado',
      productDeleteConfirm: '¿Eliminar este producto?',
      productDeleted: 'Producto eliminado',
      productPerMonth: '{0}/mes',
      productPerYear: '{0}/año',
      // Preview links
      websiteCopyLink: 'Copiar Enlace',
      websiteSendWhatsApp: 'Enviar por WhatsApp',
      websiteLinkCopied: 'Enlace de vista previa copiado',
      // Website lifecycle
      websitePublish: 'Publicar',
      websiteUnpublish: 'Despublicar',
      websiteSuspend: 'Suspender',
      websiteReactivate: 'Reactivar',
      websiteCopyLiveUrl: 'Copiar URL',
      websitePublished: 'Sitio web publicado',
      websiteUnpublished: 'Sitio web despublicado',
      websiteSuspended: 'Sitio web suspendido',
      websiteReactivated: 'Sitio web reactivado',
      websiteLiveUrlCopied: 'URL del sitio copiado',
      websitePublishError: 'Error al actualizar el sitio web',
      websiteStatusDraft: 'Borrador',
      websiteStatusPublished: 'Publicado',
      websiteStatusSuspended: 'Suspendido',
      websiteStatusActive: 'Activo',
      // Website & Domain (in customer detail)
      custWebsiteSection: 'Sitio Web',
      custWebsiteStatus: 'Estado del Sitio',
      custPublishedUrl: 'URL Publicada',
      custWebsiteVersion: 'Versión',
      custDomainSection: 'Dominio Personalizado',
      custDomainNone: 'Sin dominio propio',
      custDomainAdd: 'Agregar Dominio',
      custDomainAdding: 'Agregando...',
      custDomainPlaceholder: 'www.sunegocio.com',
      custDomainVerify: 'Verificar',
      custDomainVerifying: 'Verificando...',
      custDomainRemove: 'Quitar',
      custDomainRemoving: 'Quitando...',
      custDomainAdded: 'Dominio agregado — esperando verificación DNS',
      custDomainVerified: 'Dominio verificado',
      custDomainPending: 'Pendiente de verificación',
      custDomainFailed: 'Verificación fallida — revisar DNS',
      custDomainRemoved: 'Dominio eliminado',
      custDomainError: 'Error en operación de dominio',
      custDnsCname: 'CNAME',
      custDnsValue: 'cname.vercel-dns.com',
      custDnsInstructions: 'Agrega este registro DNS en el registrador de dominio:',
      custStatusPublished: 'Publicado',
      custStatusDraft: 'Borrador',
      custStatusSuspended: 'Suspendido',
      custNoWebsite: 'Aún no se ha generado un sitio web',
      // Customers
      navCustomers: 'Clientes',
      customersTitle: 'Clientes',
      customersSearchPh: 'Buscar clientes...',
      customersEmpty: 'Aún no hay clientes. Los clientes aparecerán aquí cuando compren un sitio web.',
      customersStatusActive: 'Activa',
      customersStatusPastDue: 'Pago Pendiente',
      customersStatusCancelled: 'Cancelada',
      customersStatusIncomplete: 'Incompleta',
      custColBusiness: 'Negocio',
      custColContact: 'Contacto',
      custColEmail: 'Correo',
      custColPhone: 'Teléfono',
      custColPlan: 'Plan',
      custColDemoUrl: 'Demo Website',
      custColLiveUrl: 'URL Publicada',
      custColPurchased: 'Dominio Comprado',
      custColStatus: 'Estado',
      custColSince: 'Desde',
      custColActions: 'Acciones',
      backToCustomers: 'Volver a Clientes',
      custView: 'Ver',
      custTotalCustomers: '{0} clientes',
      custActiveCount: '{0} activos',
      custMrr: 'MRR: {0}',
      custDetailBusiness: 'Información del Negocio',
      custDetailContact: 'Información de Contacto',
      custDetailSubscription: 'Suscripción',
      custDetailNotes: 'Notas',
      custNotesSave: 'Guardar Notas',
      custNotesSaved: 'Notas guardadas',
      custNoSubscription: 'Sin suscripción',
      custWhatsApp: 'WhatsApp',
      custPortalLink: 'Portal del Cliente',
      custWebsite: 'Sitio Web',
      custCategory: 'Categoría',
      custAddress: 'Dirección',
      custRating: 'Calificación',
      custPipeline: 'Pipeline',
      custStripeId: 'Stripe ID',
      custBillingPeriod: 'Periodo de Cobro',
      // Report & AI Photos modals
      reportModalTitle: 'Informe de Investigación',
      aiPhotosModalTitle: 'Fotos Generadas con IA',
      aiPhotosEmpty: 'Aún no se han generado fotos con IA',
      aiPhotosSection: 'Sección',
      regenerateReport: 'Regenerar Informe',
      regeneratePhotos: 'Regenerar Fotos',
      regenerateWebsite: 'Regenerar Página Web',
      regeneratingReport: 'Regenerando…',
      regeneratingPhotos: 'Regenerando…',
      openWebsite: 'Abrir Página Web',
      // Edit Requests management
      navEditRequests: 'Solicitudes de Cambios',
      erAllStatuses: 'Todos los estados',
      erAllPriorities: 'Todas las prioridades',
      erSearchPh: 'Buscar solicitudes...',
      erEmpty: 'Aún no hay solicitudes de cambio',
      erBack: '← Volver a la lista',
      erDetailTitle: 'Solicitud de Cambio',
      erColDate: 'Fecha',
      erColBusiness: 'Negocio',
      erColType: 'Tipo',
      erColDescription: 'Descripción',
      erColPriority: 'Prioridad',
      erColStatus: 'Estado',
      erColActions: 'Acciones',
      erStatusSubmitted: 'Enviada',
      erStatusProcessing: 'Procesando',
      erStatusInReview: 'En Revisión',
      erStatusInProgress: 'En Progreso',
      erStatusReadyForReview: 'Listo para Revisar',
      erStatusCompleted: 'Completada',
      erStatusRejected: 'Rechazada',
      erStatusCustomerRejected: 'Rechazado por Cliente',
      erPriorityLow: 'Baja',
      erPriorityNormal: 'Normal',
      erPriorityHigh: 'Alta',
      erPriorityUrgent: 'Urgente',
      erTypeContent: 'Actualizar Contenido',
      erTypePhoto: 'Actualizar Fotos',
      erTypeContact: 'Actualizar Contacto',
      erTypeHours: 'Actualizar Horario',
      erTypeMenu: 'Actualizar Menú',
      erTypeDesign: 'Cambio de Diseño',
      erTypeOther: 'Otro',
      erView: 'Ver',
      erUpdateStatus: 'Actualizar Estado',
      erAdminNotes: 'Notas del Admin',
      erSaveNotes: 'Guardar Notas',
      erRejectionReason: 'Motivo de Rechazo',
      erElementInfo: 'Información del Elemento',
      erAiConversation: 'Conversación con IA',
      erCustomer: 'Cliente',
      erStatsTotal: 'Total: {0}',
      erStatsOpen: 'Abiertas: {0}',
      // Team management
      navTeam: 'Equipo',
      teamEmail: 'Correo',
      teamName: 'Nombre',
      teamRole: 'Rol',
      teamStatus: 'Estado',
      teamJoined: 'Incorporación',
      teamActions: 'Acciones',
      teamInvite: 'Invitar Empleado',
      teamInviting: 'Enviando…',
      teamInviteSuccess: 'Invitación enviada a {0}',
      teamInviteError: 'Error al enviar invitación',
      teamDeactivate: 'Desactivar',
      teamActivate: 'Activar',
      teamResend: 'Reenviar',
      teamResending: 'Enviando…',
      teamResendSuccess: 'Invitación reenviada a {0}',
      teamResendError: 'Error al reenviar invitación',
      teamRoleAdmin: 'Admin',
      teamRoleEmployee: 'Empleado',
      teamStatusActive: 'Activo',
      teamStatusInactive: 'Inactivo',
      teamStatusPending: 'Pendiente',
      teamNoEmployees: 'No hay miembros del equipo. Invita a tu primer empleado arriba.',
      teamLoadError: 'Error al cargar miembros del equipo',
      teamUpdateSuccess: 'Empleado actualizado',
      teamUpdateError: 'Error al actualizar empleado',
      // Email
      navEmail: 'Correo',
      emailCustomerEmails: 'Correos de Clientes',
      emailInbox: 'Bandeja',
      emailCompose: 'Redactar',
      emailSearchPlaceholder: 'Buscar correos...',
      emailSelectConversation: 'Seleccione una conversación para ver correos',
      emailNoConversations: 'No hay conversaciones de correo aún',
      emailComposeTitle: 'Nuevo Correo',
      emailTo: 'Para',
      emailSubject: 'Asunto',
      emailBody: 'Cuerpo',
      emailSendBtn: 'Enviar Correo',
      emailSending: 'Enviando...',
      emailSent: 'Correo enviado',
      emailSendError: 'Error al enviar correo',
      emailReplyPlaceholder: 'Escribe una respuesta...',
      emailReplySubjectPh: 'Asunto',
      emailReply: 'Responder',
      emailAttachments: '{0} archivo(s) adjunto(s)',
      // Templates
      navTemplates: 'Plantillas',
      templatesTitle: 'Plantillas de Email',
      templatesNew: 'Nueva Plantilla',
      templatesEmpty: 'No hay plantillas de email aún.',
      templatesSeed: 'Crear Plantillas Predeterminadas',
      templatesFlowsTitle: 'Flujos de Automatización',
      templatesBack: '\u2190 Volver',
      templatesNamePh: 'Nombre de plantilla...',
      templatesVisual: 'Visual',
      templatesHtml: 'HTML',
      templatesPreview: 'Vista Previa',
      templatesTest: 'Enviar Prueba',
      templatesSave: 'Guardar',
      templatesSubject: 'Línea de Asunto',
      templatesCategory: 'Categoría',
      templatesCatTransactional: 'Transaccional',
      templatesCatMarketing: 'Marketing',
      templatesCatCustom: 'Personalizada',
      templatesTrigger: 'Evento Disparador',
      templatesDescription: 'Descripción',
      templatesMergeTags: 'Variables de Combinación',
      templatesPreviewTitle: 'Vista Previa de Plantilla',
      templatesDesktop: 'Escritorio',
      templatesMobile: 'Móvil',
      templatesSendTest: 'Enviar Email de Prueba',
      templatesSendTestBtn: 'Enviar Prueba',
      templatesSaved: 'Plantilla guardada',
      templatesSaveError: 'Error al guardar plantilla',
      templatesDeleted: 'Plantilla eliminada',
      templatesDeleteError: 'Error al eliminar plantilla',
      templatesDuplicated: 'Plantilla duplicada',
      templatesDuplicateError: 'Error al duplicar plantilla',
      templatesSeeded: 'Plantillas predeterminadas creadas',
      templatesSeedError: 'Error al crear plantillas',
      templatesTestSent: 'Email de prueba enviado',
      templatesTestError: 'Error al enviar email de prueba',
      templatesConfirmDelete: '¿Eliminar esta plantilla?',
      templatesFlowLinked: 'Vinculado: {0}',
      templatesFlowNotLinked: 'No vinculado',
      templatesTriggerNone: 'Ninguno',
    },
  };

  function t(key, ...args) {
    let str = (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg);
    });
    return str;
  }

  function applyLanguage() {
    // Only set elements whose keys exist in our translations (avoid overwriting app.js keys)
    const lang = translations[currentLang] || {};
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!lang[key]) return;
      el.textContent = lang[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!lang[key]) return;
      el.placeholder = lang[key];
    });
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
    document.title = currentLang === 'es'
      ? 'Admin del Operador — Buscador de Negocios Locales'
      : 'Operator Admin — Local Business Finder';
  }

  // ── Toast Notifications ──
  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
  }

  // ── Utilities ──
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStars(rating) {
    if (!rating) return '—';
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) html += '\u2605';
      else if (i === full && hasHalf) html += '<span class="star-half">\u2605</span>';
      else html += '\u2606';
    }
    return html;
  }

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(t('timeoutError', label, ms / 1000))), ms)
      ),
    ]);
  }

  // ── SSE Report Parser ──
  async function parseSSEReportResponse(response) {
    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const eventData = line.slice(6).trim();
        if (eventData === '[DONE]') continue;
        try {
          const event = JSON.parse(eventData);
          if (event.type === 'content_block_delta' && event.delta && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
          }
        } catch (e) { /* skip malformed SSE events */ }
      }
    }

    let jsonText = fullText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    // Clean trailing commas before ] or }
    jsonText = jsonText.replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(jsonText);
    } catch (parseErr) {
      console.warn('Report JSON parse failed:', parseErr.message);

      // Try to recover truncated JSON by finding the last complete top-level brace
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const matched = jsonMatch[0].replace(/,\s*([\]}])/g, '$1');
        try {
          return JSON.parse(matched);
        } catch (e) { /* fall through */ }
      }

      // Try to find last valid closing brace
      let braceDepth = 0;
      let lastValidEnd = -1;
      for (let i = 0; i < jsonText.length; i++) {
        if (jsonText[i] === '{') braceDepth++;
        else if (jsonText[i] === '}') {
          braceDepth--;
          if (braceDepth === 0) { lastValidEnd = i; break; }
        }
      }
      if (lastValidEnd > 0) {
        const trimmed = jsonText.substring(0, lastValidEnd + 1).replace(/,\s*([\]}])/g, '$1');
        try {
          return JSON.parse(trimmed);
        } catch (e) { /* fall through */ }
      }

      return { rawText: fullText, parseError: true };
    }
  }

  // ── Pipeline Progress Popup ──
  function showPipelinePopup(businessName) {
    // Remove existing popup if any
    const existing = document.getElementById('pipeline-popup-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pipeline-popup-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '2500';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:420px;padding:24px">
        <h2 style="margin:0 0 20px;font-size:18px">${t('pipelineTitle', escapeHtml(businessName))}</h2>
        <div id="pipeline-steps">
          <div class="pipeline-step" id="pipeline-step-report">
            <span class="pipeline-icon">&#9711;</span>
            <span class="pipeline-label">${t('pipelineStepReport')}</span>
            <span class="pipeline-status" style="color:var(--text-dim)">${t('pipelineStatusPending')}</span>
          </div>
          <div class="pipeline-step" id="pipeline-step-photos">
            <span class="pipeline-icon">&#9711;</span>
            <span class="pipeline-label">${t('pipelineStepPhotos')}</span>
            <span class="pipeline-status" style="color:var(--text-dim)">${t('pipelineStatusPending')}</span>
          </div>
          <div class="pipeline-step" id="pipeline-step-website">
            <span class="pipeline-icon">&#9711;</span>
            <span class="pipeline-label">${t('pipelineStepWebsite')}</span>
            <span class="pipeline-status" style="color:var(--text-dim)">${t('pipelineStatusPending')}</span>
          </div>
        </div>
        <button class="btn btn-secondary" id="pipeline-close-btn" style="margin-top:20px;width:100%;display:none">${t('pipelineClose')}</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Style the steps
    overlay.querySelectorAll('.pipeline-step').forEach(step => {
      step.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;';
    });
    overlay.querySelectorAll('.pipeline-icon').forEach(icon => {
      icon.style.cssText = 'font-size:18px;width:24px;text-align:center;';
    });
    overlay.querySelectorAll('.pipeline-label').forEach(label => {
      label.style.cssText = 'flex:1;font-weight:600;';
    });
    overlay.querySelectorAll('.pipeline-status').forEach(status => {
      status.style.cssText = 'font-size:13px;';
    });

    const closeBtn = document.getElementById('pipeline-close-btn');
    closeBtn.addEventListener('click', () => overlay.remove());

    return {
      setStep(stepId, state) {
        const step = document.getElementById('pipeline-step-' + stepId);
        if (!step) return;
        const icon = step.querySelector('.pipeline-icon');
        const status = step.querySelector('.pipeline-status');
        if (state === 'running') {
          icon.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>';
          status.textContent = t('pipelineStatusRunning');
          status.style.color = 'var(--primary)';
        } else if (state === 'done') {
          icon.textContent = '\u2713';
          icon.style.color = 'var(--success)';
          status.textContent = t('pipelineStatusDone');
          status.style.color = 'var(--success)';
        } else if (state === 'error') {
          icon.textContent = '\u2717';
          icon.style.color = 'var(--danger)';
          status.textContent = t('pipelineStatusError');
          status.style.color = 'var(--danger)';
        }
      },
      showClose() {
        const btn = document.getElementById('pipeline-close-btn');
        if (btn) btn.style.display = '';
      },
      close() {
        overlay.remove();
      }
    };
  }

  // ── Supabase ──
  // Initialized from server config via initSupabaseFromConfig(), fallback is empty
  const SUPABASE_URL_FALLBACK = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const SUPABASE_KEY_FALLBACK = '';
  let supabaseClient = null;

  async function initSupabaseFromConfig() {
    if (!window.supabase) {
      console.warn('Supabase SDK not loaded.');
      return;
    }
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const url = data.supabaseUrl || SUPABASE_URL_FALLBACK;
        const key = data.supabaseKey || SUPABASE_KEY_FALLBACK;
        if (url && key) {
          supabaseClient = window.supabase.createClient(url, key);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch config:', err.message);
    }
    // Fallback
    if (SUPABASE_URL_FALLBACK && SUPABASE_KEY_FALLBACK) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL_FALLBACK, SUPABASE_KEY_FALLBACK);
    }
  }

  // ── State ──
  let currentPage = 0;
  let pageSize = 25;
  let totalCount = 0;
  let currentResults = [];
  let allFiltered = []; // Full filtered dataset for client-side pagination
  const selectedIds = new Set(); // Selected business IDs for bulk actions
  let allBusinesses = []; // Unfiltered dataset for pipeline counts
  let pipelineStage = 'all'; // Currently selected pipeline filter
  // Cache for detail modal data (keyed by business ID)
  const detailCache = {};

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const resultsBody = $('#results-body');
  const resultsSummary = $('#results-summary');
  const pageInfo = $('#page-info');
  const noResults = $('#no-results');
  const btnPrev = $('#btn-prev');
  const btnNext = $('#btn-next');
  const pageSizeSelect = $('#page-size');

  // Filter inputs
  const filterLocation = $('#filter-location');
  const filterCountry = $('#filter-country');
  const filterType = $('#filter-type');
  const filterRating = $('#filter-rating');
  const filterReviews = $('#filter-reviews');
  const filterInstagram = $('#filter-instagram');
  const filterIgPosts = $('#filter-ig-posts');
  const filterFacebook = $('#filter-facebook');
  const filterReport = $('#filter-report');
  const filterWebsite = $('#filter-website');
  const pipelineSearch = document.getElementById('pipeline-search');

  // ── Initialize ──
  async function init() {
    // Initialize Supabase from server config before anything else
    await initSupabaseFromConfig();

    applyLanguage();

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentLang = btn.getAttribute('data-lang');
        localStorage.setItem('app_lang', currentLang);
        applyLanguage();
        // Re-render table with new language
        if (currentResults.length > 0) renderTable();
      });
    });

    // Pipeline pills
    document.querySelectorAll('.pipeline-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const stage = pill.getAttribute('data-stage');
        applyPipelineFilter(stage);
      });
    });

    // Pipeline search
    if (pipelineSearch) {
      pipelineSearch.addEventListener('input', () => applyPipelineFilter());
    }

    // Section nav (search/pipeline scroll pills)
    initSectionNav();

    // Enable/disable IG posts filter based on Has Instagram
    filterInstagram.addEventListener('change', () => {
      filterIgPosts.disabled = filterInstagram.value !== 'yes';
      if (filterIgPosts.disabled) filterIgPosts.value = '';
    });

    // Apply filters
    $('#btn-apply-filters').addEventListener('click', () => {
      currentPage = 0;
      loadBusinesses();
    });

    // Clear filters
    $('#btn-clear-filters').addEventListener('click', () => {
      filterLocation.value = '';
      filterCountry.value = '';
      filterType.value = '';
      filterRating.value = '';
      filterReviews.value = '';
      filterInstagram.value = '';
      filterIgPosts.value = '';
      filterIgPosts.disabled = true;
      filterFacebook.value = '';
      filterReport.value = '';
      filterWebsite.value = '';
      if (pipelineSearch) pipelineSearch.value = '';
      currentPage = 0;
      loadBusinesses();
    });

    // Pagination
    btnPrev.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        renderCurrentPage();
      }
    });
    btnNext.addEventListener('click', () => {
      const totalPages = Math.ceil(totalCount / pageSize);
      if (currentPage < totalPages - 1) {
        currentPage++;
        renderCurrentPage();
      }
    });
    // Select-all checkbox
    const selectAllCb = document.getElementById('select-all');
    if (selectAllCb) {
      selectAllCb.addEventListener('change', () => {
        const pageIds = currentResults.map(b => String(b.id));
        if (selectAllCb.checked) {
          pageIds.forEach(id => selectedIds.add(id));
        } else {
          pageIds.forEach(id => selectedIds.delete(id));
        }
        resultsBody.querySelectorAll('.row-select').forEach(cb => {
          cb.checked = selectAllCb.checked;
        });
        updateBulkActionsBar();
      });
    }

    // Bulk action buttons
    const btnBulkDelete = document.getElementById('btn-bulk-delete');
    if (btnBulkDelete) btnBulkDelete.addEventListener('click', bulkDelete);
    const btnBulkEnrich = document.getElementById('btn-bulk-enrich');
    if (btnBulkEnrich) btnBulkEnrich.addEventListener('click', bulkEnrich);
    const btnBulkClear = document.getElementById('btn-bulk-clear');
    if (btnBulkClear) btnBulkClear.addEventListener('click', clearSelection);

    pageSizeSelect.addEventListener('change', () => {
      pageSize = parseInt(pageSizeSelect.value, 10);
      currentPage = 0;
      renderCurrentPage();
    });

    // Enter key on location filter
    filterLocation.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        currentPage = 0;
        loadBusinesses();
      }
    });

    // Tab navigation — event delegation on grouped nav dropdowns + bottom nav
    document.querySelectorAll('.nav-dropdown-item[data-tab]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(item.dataset.tab);
        // Close dropdown
        document.querySelectorAll('.nav-group.open').forEach(g => g.classList.remove('open'));
      });
    });

    // Desktop dropdown toggle (click-based)
    document.querySelectorAll('.nav-group-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const group = trigger.closest('.nav-group');
        if (!group) return;
        // If this group has no dropdown, it's a plain link — let it navigate
        if (!group.querySelector('.nav-dropdown')) return;
        document.querySelectorAll('.nav-group.open').forEach(g => {
          if (g !== group) g.classList.remove('open');
        });
        group.classList.toggle('open');
      });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-group')) {
        document.querySelectorAll('.nav-group.open').forEach(g => g.classList.remove('open'));
      }
    });

    // Desktop dropdown lang buttons
    document.querySelectorAll('.nav-dropdown-lang .lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentLang = btn.dataset.lang;
        localStorage.setItem('app_lang', currentLang);
        applyLanguage();
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
      });
    });

    // Sync templates button
    const syncBtn = document.getElementById('btn-sync-templates');
    if (syncBtn) {
      syncBtn.addEventListener('click', syncTemplates);
    }

    // Conversation search
    const convSearch = document.getElementById('conv-search');
    if (convSearch) {
      convSearch.addEventListener('input', renderConversationsList);
    }

    // Audiences bindings
    const btnCreateAudience = document.getElementById('btn-create-audience');
    if (btnCreateAudience) btnCreateAudience.addEventListener('click', () => openAudienceEditor());
    const btnCancelAudience = document.getElementById('btn-cancel-audience');
    if (btnCancelAudience) btnCancelAudience.addEventListener('click', closeAudienceEditor);
    const btnPreviewAudience = document.getElementById('btn-preview-audience');
    if (btnPreviewAudience) btnPreviewAudience.addEventListener('click', previewAudience);
    const btnSaveAudience = document.getElementById('btn-save-audience');
    if (btnSaveAudience) btnSaveAudience.addEventListener('click', saveAudience);

    // Campaigns bindings
    const btnCreateCampaign = document.getElementById('btn-create-campaign');
    if (btnCreateCampaign) btnCreateCampaign.addEventListener('click', () => openCampaignEditor());
    const btnCancelCampaign = document.getElementById('btn-cancel-campaign');
    if (btnCancelCampaign) btnCancelCampaign.addEventListener('click', closeCampaignEditor);
    const btnSaveCampaign = document.getElementById('btn-save-campaign');
    if (btnSaveCampaign) btnSaveCampaign.addEventListener('click', () => saveCampaign(false));
    const btnSendCampaign = document.getElementById('btn-send-campaign');
    if (btnSendCampaign) btnSendCampaign.addEventListener('click', () => saveCampaign(true));
    const btnBackCampaigns = document.getElementById('btn-back-campaigns');
    if (btnBackCampaigns) btnBackCampaigns.addEventListener('click', closeCampaignDetail);

    const campaignTemplate = document.getElementById('campaign-template');
    if (campaignTemplate) campaignTemplate.addEventListener('change', onCampaignTemplateChange);

    // Load templates and start realtime
    loadTemplates();
    setupRealtimeSubscription();
    setupEmailRealtimeSubscription();

    // Initial load
    loadStats();
    loadBusinesses();
  }

  // ── Stats ──
  async function loadStats() {
    if (!supabaseClient) return;

    try {
      const [totalRes, leadsRes, activeRes, websitesRes] = await Promise.all([
        supabaseClient.from('businesses').select('id', { count: 'exact', head: true }),
        supabaseClient.from('businesses').select('id', { count: 'exact', head: true }).eq('pipeline_status', 'lead'),
        supabaseClient.from('businesses').select('id', { count: 'exact', head: true }).eq('pipeline_status', 'active_customer'),
        supabaseClient.from('generated_websites').select('id', { count: 'exact', head: true }),
      ]);

      var total = totalRes.count || 0;
      $('#stat-total').textContent = total;
      $('#stat-leads').textContent = leadsRes.count || 0;
      $('#stat-active-customers').textContent = activeRes.count || 0;
      $('#stat-websites').textContent = websitesRes.count || 0;
      updateSectionNavCount(total);
    } catch (err) {
      console.error('Stats load error:', err);
    }
  }

  // ── Load Businesses ──
  async function loadBusinesses() {
    if (!supabaseClient) {
      showToast(t('errorLoading'), 'error');
      return;
    }

    resultsBody.innerHTML = `<tr><td colspan="23" style="text-align:center;padding:24px;color:var(--text-muted)">${t('loadingData')}</td></tr>`;
    noResults.style.display = 'none';

    try {
      let query = supabaseClient
        .from('businesses')
        .select('*, business_social_profiles(*), generated_websites(id, status, site_status, published_url, config), business_contacts(*)');

      // Apply filters
      const loc = filterLocation.value.trim();
      if (loc) {
        query = query.ilike('address_full', `%${loc}%`);
      }
      const country = filterCountry.value;
      if (country) {
        query = query.eq('address_country', country);
      }
      const type = filterType.value;
      if (type) {
        query = query.eq('category', type);
      }
      const minRating = filterRating.value;
      if (minRating) {
        query = query.gte('rating', parseFloat(minRating));
      }
      const minReviews = filterReviews.value;
      if (minReviews && parseInt(minReviews, 10) > 0) {
        query = query.gte('review_count', parseInt(minReviews, 10));
      }

      // Order (no server-side pagination — fetch all, paginate client-side)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Client-side filtering for social profile filters (Supabase doesn't easily filter on nested joins)
      let filtered = data || [];

      const igFilter = filterInstagram.value;
      if (igFilter === 'yes') {
        filtered = filtered.filter(b => hasProfile(b, 'instagram'));
      } else if (igFilter === 'no') {
        filtered = filtered.filter(b => !hasProfile(b, 'instagram'));
      }

      const igPostsMin = parseInt(filterIgPosts.value, 10);
      if (igFilter === 'yes' && igPostsMin > 0) {
        filtered = filtered.filter(b => {
          const ig = getProfile(b, 'instagram');
          return ig && ig.post_count && ig.post_count >= igPostsMin;
        });
      }

      const fbFilter = filterFacebook.value;
      if (fbFilter === 'yes') {
        filtered = filtered.filter(b => hasProfile(b, 'facebook'));
      } else if (fbFilter === 'no') {
        filtered = filtered.filter(b => !hasProfile(b, 'facebook'));
      }

      const reportFilter = filterReport.value;
      if (reportFilter === 'yes') {
        filtered = filtered.filter(b => hasResearchReport(b));
      } else if (reportFilter === 'no') {
        filtered = filtered.filter(b => !hasResearchReport(b));
      }

      const websiteFilter = filterWebsite.value;
      if (websiteFilter === 'yes') {
        filtered = filtered.filter(b => hasGeneratedWebsite(b));
      } else if (websiteFilter === 'no') {
        filtered = filtered.filter(b => !hasGeneratedWebsite(b));
      }

      // Store unfiltered-by-pipeline for counts, then apply pipeline filter
      allBusinesses = filtered;
      updatePipelineCounts(allBusinesses);

      if (pipelineStage !== 'all') {
        filtered = filtered.filter(b => (b.pipeline_status || 'saved') === pipelineStage);
      }

      allFiltered = filtered;
      totalCount = allFiltered.length;
      renderCurrentPage();
    } catch (err) {
      console.error('Load businesses error:', err);
      showToast(t('errorLoading'), 'error');
      resultsBody.innerHTML = '';
    }
  }

  // ── Pipeline Counts ──
  function updatePipelineCounts(businesses) {
    const counts = { all: businesses.length, saved: 0, lead: 0, demo: 0, active_customer: 0, inactive_customer: 0 };
    businesses.forEach(b => {
      const status = b.pipeline_status || 'saved';
      if (counts[status] !== undefined) counts[status]++;
    });
    const el = (id) => document.getElementById(id);
    el('pill-count-all').textContent = counts.all;
    el('pill-count-saved').textContent = counts.saved;
    el('pill-count-lead').textContent = counts.lead;
    el('pill-count-demo').textContent = counts.demo;
    el('pill-count-active').textContent = counts.active_customer;
    el('pill-count-inactive').textContent = counts.inactive_customer;
  }

  // ── Pipeline Filter (client-side re-filter from allBusinesses) ──
  function applyPipelineFilter(stage) {
    if (stage !== undefined) pipelineStage = stage;
    // Update active pill
    document.querySelectorAll('.pipeline-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-stage') === pipelineStage);
    });
    // Re-filter from allBusinesses
    let filtered = allBusinesses;
    if (pipelineStage !== 'all') {
      filtered = filtered.filter(b => (b.pipeline_status || 'saved') === pipelineStage);
    }
    // Apply search
    const search = (pipelineSearch ? pipelineSearch.value : '').toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(b => {
        const contactFields = (b.business_contacts || []).flatMap(c => [c.contact_name, c.contact_email, c.contact_phone, c.contact_whatsapp, c.contact_title]);
        const haystack = [
          b.name, b.phone, b.email, b.business_code, b.contact_name, b.contact_email, b.contact_phone, b.contact_whatsapp, b.address_full, b.address_country, b.whatsapp,
          ...contactFields
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(search);
      });
    }
    allFiltered = filtered;
    totalCount = allFiltered.length;
    currentPage = 0;
    renderCurrentPage();
  }

  // ── Helpers ──
  function hasProfile(business, platform) {
    const profiles = business.business_social_profiles || [];
    return profiles.some(p => p.platform === platform);
  }

  function getProfile(business, platform) {
    const profiles = business.business_social_profiles || [];
    return profiles.find(p => p.platform === platform);
  }

  function hasResearchReport(business) {
    return (business.generated_websites || []).some(w => w.config && w.config.researchReport) || !!business._cachedReport;
  }

  function hasGeneratedWebsite(business) {
    return (business.generated_websites || []).some(w => w.config && w.config.html);
  }

  function getWebsiteStatus(business) {
    if (!business.generated_websites || business.generated_websites.length === 0) return null;
    return business.generated_websites[0].status || 'draft';
  }

  function getStageBadgeHtml(status) {
    const s = status || 'saved';
    const classMap = {
      saved: 'badge-saved',
      lead: 'badge-lead',
      demo: 'badge-demo',
      active_customer: 'badge-active-customer',
      inactive_customer: 'badge-inactive-customer',
    };
    const labelMap = {
      saved: 'stageSaved',
      lead: 'stageLead',
      demo: 'stageDemo',
      active_customer: 'stageActiveCustomer',
      inactive_customer: 'stageInactiveCustomer',
    };
    const cls = classMap[s] || 'badge-saved';
    const label = t(labelMap[s] || 'stageSaved');
    return `<span class="badge-stage ${cls}">${escapeHtml(label)}</span>`;
  }

  function extractCity(addressFull) {
    if (!addressFull) return '—';
    // Try to extract city, state from full address
    const parts = addressFull.split(',').map(s => s.trim());
    if (parts.length >= 3) return parts[1] + ', ' + parts[2].split(' ')[0];
    if (parts.length >= 2) return parts[1];
    return parts[0];
  }

  function extractCategory(types) {
    if (!types || types.length === 0) return '—';
    // Get the most relevant type (skip generic ones)
    const skip = ['point_of_interest', 'establishment', 'store', 'food'];
    const filtered = types.filter(t => !skip.includes(t));
    const type = filtered[0] || types[0];
    return type.replace(/_/g, ' ');
  }

  // ── Social Cell Rendering ──
  const SOCIAL_ICONS = {
    yelp: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.271 6.997c-.263 3.6-.681 5.632-1.554 5.632-.192 0-.417-.085-.661-.254L6.59 9.834c-.748-.516-.88-1.2-.355-1.838.526-.637 2.009-1.782 3.236-2.502.765-.449 1.395-.49 1.823-.118.284.247.248.788-.023 1.621zm-2.225 8.592c.206-.134.482-.2.807-.2.855 0 1.618.525 1.699.612l3.01 3.345c.542.638.453 1.338-.243 1.883a10.146 10.146 0 0 1-3.643 1.619c-.86.212-1.447-.026-1.67-.593l-1.255-3.91c-.268-.833.154-1.487 1.295-2.756zm5.96-2.461l3.773-1.367c.825-.278 1.431-.067 1.63.563a10.15 10.15 0 0 1-.104 3.99c-.228.847-.766 1.196-1.488.96l-3.828-1.186c-.9-.279-1.217-.864-1.042-1.628.138-.612.55-1.12 1.059-1.332zm-.34-2.138l-3.808-1.27c-.868-.291-1.16-.882-.96-1.638.16-.606.587-1.1 1.1-1.296l3.754-1.445c.823-.295 1.435-.095 1.647.536a10.151 10.151 0 0 1 .022 3.994c-.213.852-.762 1.213-1.495.986l-.26-.087v.22zm-5.49 3.858c.867.113 1.308.614 1.308 1.414 0 .175-.018.362-.052.558l-.722 3.981c-.16.814-.69 1.155-1.476.925a10.063 10.063 0 0 1-3.3-2.088c-.615-.614-.692-1.262-.21-1.793l2.808-2.825c.31-.31.547-.343 1.644-.172z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
  };

  const SOCIAL_COLORS = {
    yelp: '#d32323',
    facebook: '#1877f2',
    instagram: '#e4405f',
  };

  const SOCIAL_PLATFORM_EMOJIS = {
    facebook: '\uD83D\uDCD8', instagram: '\uD83D\uDCF7', whatsapp: '\uD83D\uDCAC',
    twitter: '\uD83D\uDCAD', tiktok: '\uD83C\uDFB5', linkedin: '\uD83D\uDCBC',
    youtube: '\u25B6\uFE0F', yelp: '\u2B50', tripadvisor: '\uD83E\uDDED',
    opentable: '\uD83C\uDF7D\uFE0F', resy: '\uD83D\uDCCB', doordash: '\uD83D\uDE97',
    ubereats: '\uD83C\uDF54', grubhub: '\uD83C\uDF71',
  };

  function buildSocialCellHtml(profiles) {
    if (!profiles || profiles.length === 0) {
      return '<span class="social-cell-none">--</span>';
    }
    const maxShow = 4;
    const shown = profiles.slice(0, maxShow);
    const icons = shown.map((p) => {
      const icon = SOCIAL_ICONS[p.platform] || '';
      const color = SOCIAL_COLORS[p.platform] || 'var(--text-muted)';
      const title = p.platform.charAt(0).toUpperCase() + p.platform.slice(1);
      const url = p.url || '#';
      if (!icon) {
        const emoji = SOCIAL_PLATFORM_EMOJIS[p.platform] || '\uD83C\uDF10';
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="social-cell-icon" title="${escapeHtml(title)}">${emoji}</a>`;
      }
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="social-cell-icon" title="${escapeHtml(title)}" style="color:${color}">${icon}</a>`;
    }).join('');
    const extra = profiles.length > maxShow ? `<span class="social-cell-more">+${profiles.length - maxShow}</span>` : '';
    return `<span class="social-cell">${icons}${extra}</span>`;
  }

  // ── Paginate from cached filtered results ──
  function renderCurrentPage() {
    const from = currentPage * pageSize;
    const to = from + pageSize;
    currentResults = allFiltered.slice(from, to);
    renderTable();
    updatePagination();
  }

  // ── Render Table ──
  function renderTable() {
    if (currentResults.length === 0) {
      resultsBody.innerHTML = '';
      noResults.style.display = '';
      resultsSummary.textContent = '';
      return;
    }

    noResults.style.display = 'none';
    resultsSummary.textContent = t('showingCount', currentResults.length, totalCount);

    const offset = currentPage * pageSize;
    resultsBody.innerHTML = currentResults.map((b, i) => {
      const profiles = b.business_social_profiles || [];
      const websiteStatus = getWebsiteStatus(b);

      const socialCellHtml = buildSocialCellHtml(profiles);

      const hasReport = (b.generated_websites || []).some(w => w.config && w.config.researchReport);
      const reportBtnLabel = hasReport ? '\u2713' : t('btnReport');
      const existingWebsiteRecord = (b.generated_websites || []).find(w => w.config && w.config.html);
      const websiteBtnLabel = existingWebsiteRecord ? '\u2713' : t('btnWebsite');
      const photosDisabled = hasReport ? '' : 'disabled';
      const websiteDisabled = hasReport ? '' : 'disabled';

      // Website URL column
      let websiteUrlHtml = '<span style="color:var(--text-dim)">—</span>';
      if (existingWebsiteRecord) {
        const wUrl = existingWebsiteRecord.published_url || '/ver/' + existingWebsiteRecord.id;
        websiteUrlHtml = `<a href="${escapeHtml(wUrl)}" target="_blank" rel="noopener" class="website-url-link" style="color:var(--primary);font-size:12px;text-decoration:underline;cursor:pointer" title="${escapeHtml(wUrl)}">${existingWebsiteRecord.published_url ? 'Live' : 'Preview'}</a>
          <button class="btn-copy-url" data-url="${escapeHtml(wUrl)}" title="Copy URL" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:12px;padding:2px 4px">📋</button>`;
      }

      const mapsLink = b.maps_url
        ? `<a href="${escapeHtml(b.maps_url)}" target="_blank" rel="noopener" class="maps-link" title="Open in Google Maps">\u{1F4CD}</a>`
        : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + (b.address_full || ''))}" target="_blank" rel="noopener" class="maps-link" title="Search on Google Maps">\u{1F4CD}</a>`;

      // Build contacts cell
      const contacts = b.business_contacts || [];
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
      const contactsCount = contacts.length;
      let contactsCellHtml;
      if (contactsCount === 0) {
        contactsCellHtml = '<span class="td-empty-placeholder">+</span>';
      } else {
        const nameDisplay = primaryContact.contact_name ? escapeHtml(primaryContact.contact_name) : '(unnamed)';
        const titleDisplay = primaryContact.contact_title ? ` <span style="color:var(--text-dim);font-size:11px">${escapeHtml(primaryContact.contact_title)}</span>` : '';
        const countBadge = contactsCount > 1 ? ` <span class="contacts-count-badge">${contactsCount}</span>` : '';
        contactsCellHtml = nameDisplay + titleDisplay + countBadge;
      }

      const isChecked = selectedIds.has(String(b.id));
      return `<tr>
        <td class="td-center col-sticky col-select"><input type="checkbox" class="pipeline-checkbox row-select" data-id="${b.id}" ${isChecked ? 'checked' : ''}></td>
        <td class="td-center col-sticky col-sticky-1">${offset + i + 1}</td>
        <td class="td-editable col-sticky col-sticky-2" data-id="${b.id}" data-field="name" data-value="${escapeHtml(b.name || '')}" title="${t('clickToEdit')}"><strong>${escapeHtml(b.name)}</strong></td>
        <td class="td-center" style="font-size:11px;color:var(--text-dim);font-family:monospace" title="${escapeHtml(b.business_code || '')}">${escapeHtml(b.business_code || '—')}</td>
        <td class="td-editable" data-id="${b.id}" data-field="address_full" data-value="${escapeHtml(b.address_full || '')}" title="${t('clickToEdit')}">${escapeHtml(extractCity(b.address_full))}</td>
        <td style="text-transform:capitalize">${escapeHtml(extractCategory(b.types))}</td>
        <td class="td-center td-editable td-editable-stage" data-id="${b.id}" data-field="pipeline_status" data-value="${escapeHtml(b.pipeline_status || 'saved')}" title="${t('clickToEdit')}">${getStageBadgeHtml(b.pipeline_status)}</td>
        <td class="td-editable" data-id="${b.id}" data-field="address_country" data-value="${escapeHtml(b.address_country || '')}" title="${b.address_country ? t('clickToEdit') : t('clickToAdd')}">${b.address_country ? escapeHtml(b.address_country) : '<span class="td-empty-placeholder">+</span>'}</td>
        <td class="td-contacts" data-id="${b.id}" title="${t('clickToEdit')}" style="cursor:pointer">${contactsCellHtml}</td>
        <td>${primaryContact && (primaryContact.contact_whatsapp || primaryContact.contact_phone) ? escapeHtml(primaryContact.contact_whatsapp || primaryContact.contact_phone) : '<span class="td-empty-placeholder">—</span>'}</td>
        <td>${primaryContact && primaryContact.contact_email ? escapeHtml(primaryContact.contact_email) : '<span class="td-empty-placeholder">—</span>'}</td>
        <td class="td-editable" data-id="${b.id}" data-field="phone" data-value="${escapeHtml(b.phone || '')}" title="${b.phone ? t('clickToEdit') : t('clickToAdd')}">${b.phone ? escapeHtml(b.phone) : '<span class="td-empty-placeholder">+</span>'}</td>
        <td class="td-editable" data-id="${b.id}" data-field="email" data-value="${escapeHtml(b.email || '')}" title="${b.email ? t('clickToEdit') : t('clickToAdd')}">${b.email ? escapeHtml(b.email) : '<span class="td-empty-placeholder">+</span>'}</td>
        <td class="td-center"><span class="stars">${renderStars(b.rating)}</span> <span class="rating-num">${b.rating ? b.rating.toFixed(1) : '—'}</span></td>
        <td class="td-center">${b.review_count ? b.review_count.toLocaleString() : '0'}</td>
        <td class="td-center">${socialCellHtml}</td>
        <td class="td-center"><button class="btn btn-view btn-report" data-id="${b.id}">${reportBtnLabel}</button></td>
        <td class="td-center"><button class="btn btn-view btn-photos" data-id="${b.id}" ${photosDisabled}>${t('btnPhotos')}</button></td>
        <td class="td-center"><button class="btn btn-view btn-website" data-id="${b.id}" ${websiteDisabled}>${websiteBtnLabel}</button></td>
        <td class="td-center">${websiteUrlHtml}</td>
        <td class="td-center"><button class="btn btn-view btn-detail" data-id="${b.id}">${t('viewBtn')}</button></td>
        <td class="td-center">${mapsLink}</td>
        <td class="td-center"><button class="btn btn-view btn-enrich" data-id="${b.id}">${b.description ? '\u2713' : t('btnEnrich')}</button></td>
        <td class="td-center">${b.phone ? `<button class="btn-msg" data-id="${b.id}" data-phone="${escapeHtml(b.phone)}">${t('msgBtnLabel')}</button>` : ''}</td>
        <td class="td-center"><button class="btn btn-view btn-delete" data-id="${b.id}" data-name="${escapeHtml(b.name)}" style="color:var(--danger);border-color:var(--danger)">${t('btnDelete')}</button></td>
      </tr>`;
    }).join('');

    // Bind report buttons
    resultsBody.querySelectorAll('.btn-report').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const business = currentResults.find(b => String(b.id) === businessId);
        if (business) handleAdminTableReport(business, btn);
      });
    });

    // Bind photos buttons
    resultsBody.querySelectorAll('.btn-photos').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const business = currentResults.find(b => String(b.id) === businessId);
        if (business) handleAdminTableAiPhotos(business, btn);
      });
    });

    // Bind website buttons
    resultsBody.querySelectorAll('.btn-website').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const business = currentResults.find(b => String(b.id) === businessId);
        if (business) handleAdminTableWebsite(business, btn);
      });
    });

    // Bind view buttons
    resultsBody.querySelectorAll('.btn-detail').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const business = currentResults.find(b => String(b.id) === businessId);
        if (business) openDetailModal(business);
      });
    });

    // Bind copy URL buttons
    resultsBody.querySelectorAll('.btn-copy-url').forEach((btn) => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        const fullUrl = url.startsWith('/') ? window.location.origin + url : url;
        navigator.clipboard.writeText(fullUrl).then(() => {
          showToast('URL copied', 'success');
        });
      });
    });

    // Bind enrich buttons
    resultsBody.querySelectorAll('.btn-enrich').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const business = currentResults.find(b => String(b.id) === businessId);
        if (business) handleEnrich(business, btn);
      });
    });

    // Bind msg buttons
    resultsBody.querySelectorAll('.btn-msg').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const phone = btn.getAttribute('data-phone');
        startNewConversation(businessId, phone);
      });
    });

    // Bind delete buttons
    resultsBody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        deleteBusiness(businessId, name);
      });
    });

    // Bind contacts cells — click opens detail modal focused on contacts
    resultsBody.querySelectorAll('.td-contacts').forEach((td) => {
      td.addEventListener('click', () => {
        const businessId = td.getAttribute('data-id');
        const business = currentResults.find(b => String(b.id) === String(businessId));
        if (business) openDetailModal(business);
      });
    });

    // Bind inline editable cells
    resultsBody.querySelectorAll('.td-editable').forEach((td) => {
      td.addEventListener('click', (e) => {
        // Don't trigger if already editing
        if (td.classList.contains('td-editing')) return;
        // Don't trigger if clicking inside an input/select already
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        startInlineEdit(td);
      });
    });

    // Bind row checkboxes
    resultsBody.querySelectorAll('.row-select').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id');
        if (cb.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        updateBulkActionsBar();
        updateSelectAllCheckbox();
      });
    });
    updateSelectAllCheckbox();
  }

  // ── Selection & Bulk Actions ──

  function updateBulkActionsBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const countEl = document.getElementById('bulk-actions-count');
    if (!bar || !countEl) return;
    if (selectedIds.size > 0) {
      bar.style.display = '';
      countEl.textContent = t('bulkSelected', selectedIds.size);
    } else {
      bar.style.display = 'none';
    }
  }

  function updateSelectAllCheckbox() {
    const selectAll = document.getElementById('select-all');
    if (!selectAll) return;
    const pageIds = currentResults.map(b => String(b.id));
    const allChecked = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
    const someChecked = pageIds.some(id => selectedIds.has(id));
    selectAll.checked = allChecked;
    selectAll.indeterminate = someChecked && !allChecked;
  }

  function clearSelection() {
    selectedIds.clear();
    updateBulkActionsBar();
    resultsBody.querySelectorAll('.row-select').forEach(cb => { cb.checked = false; });
    updateSelectAllCheckbox();
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(t('bulkDeleteConfirm', selectedIds.size))) return;
    if (!supabaseClient) return;

    const ids = Array.from(selectedIds);
    try {
      const { error } = await supabaseClient
        .from('businesses')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Bulk delete error:', error);
        showToast(t('deleteError'), 'error');
        return;
      }

      showToast(t('bulkDeleteSuccess', ids.length), 'success');
      selectedIds.clear();
      updateBulkActionsBar();
      loadBusinesses();
      loadStats();
    } catch (err) {
      console.error('Bulk delete error:', err);
      showToast(t('deleteError'), 'error');
    }
  }

  async function bulkEnrich() {
    if (selectedIds.size === 0) return;

    const businesses = currentResults.filter(b => selectedIds.has(String(b.id)));
    const enrichable = businesses.filter(b => b.place_id && !b.place_id.startsWith('marketing-'));

    if (enrichable.length === 0) {
      showToast(t('enrichNoPlaceId'), 'error');
      return;
    }

    showToast(t('bulkEnrichSuccess', enrichable.length), 'success');

    for (const business of enrichable) {
      try {
        await fetch('/api/enrich/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: business.id }),
        });
      } catch (err) {
        console.warn('Enrich failed for', business.name, err);
      }
    }

    selectedIds.clear();
    updateBulkActionsBar();
    loadBusinesses();
  }

  // ── Inline Edit ──

  function startInlineEdit(td) {
    const field = td.getAttribute('data-field');
    const businessId = td.getAttribute('data-id');
    const currentValue = td.getAttribute('data-value') || '';

    td.classList.add('td-editing');

    if (field === 'pipeline_status') {
      // Show a dropdown for pipeline stage
      const stages = [
        { value: 'saved', label: t('stageSaved') },
        { value: 'lead', label: t('stageLead') },
        { value: 'demo', label: t('stageDemo') },
        { value: 'active_customer', label: t('stageActiveCustomer') },
        { value: 'inactive_customer', label: t('stageInactiveCustomer') },
      ];
      const select = document.createElement('select');
      select.className = 'inline-edit-select';
      stages.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.value;
        opt.textContent = s.label;
        if (s.value === currentValue) opt.selected = true;
        select.appendChild(opt);
      });
      td.textContent = '';
      td.appendChild(select);
      select.focus();

      select.addEventListener('change', () => {
        saveInlineEdit(td, businessId, field, select.value);
      });
      select.addEventListener('blur', () => {
        // If value didn't change, just cancel
        if (select.value === currentValue) {
          cancelInlineEdit(td, field, currentValue);
        } else {
          saveInlineEdit(td, businessId, field, select.value);
        }
      });
      select.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          cancelInlineEdit(td, field, currentValue);
        }
      });
    } else {
      // Show a text input
      const input = document.createElement('input');
      input.type = field === 'email' ? 'email' : 'text';
      input.className = 'inline-edit-input';
      input.value = currentValue;
      input.placeholder = t('clickToAdd');
      td.textContent = '';
      td.appendChild(input);
      input.focus();
      input.select();

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveInlineEdit(td, businessId, field, input.value.trim());
        } else if (e.key === 'Escape') {
          cancelInlineEdit(td, field, currentValue);
        } else if (e.key === 'Tab') {
          // Save on tab and let browser move focus
          saveInlineEdit(td, businessId, field, input.value.trim());
        }
      });
      input.addEventListener('blur', () => {
        // Small delay to allow Tab to trigger save first
        setTimeout(() => {
          if (td.classList.contains('td-editing')) {
            saveInlineEdit(td, businessId, field, input.value.trim());
          }
        }, 100);
      });
    }
  }

  function cancelInlineEdit(td, field, originalValue) {
    td.classList.remove('td-editing');
    if (field === 'pipeline_status') {
      td.innerHTML = getStageBadgeHtml(originalValue);
    } else if (field === 'name') {
      td.innerHTML = originalValue ? `<strong>${escapeHtml(originalValue)}</strong>` : '<span class="td-empty-placeholder">+</span>';
    } else if (field === 'address_full') {
      td.innerHTML = originalValue ? escapeHtml(extractCity(originalValue)) : '<span class="td-empty-placeholder">+</span>';
    } else {
      td.innerHTML = originalValue ? escapeHtml(originalValue) : '<span class="td-empty-placeholder">+</span>';
    }
  }

  async function saveInlineEdit(td, businessId, field, newValue) {
    const originalValue = td.getAttribute('data-value') || '';

    // No change — just cancel
    if (newValue === originalValue) {
      cancelInlineEdit(td, field, originalValue);
      return;
    }

    td.classList.remove('td-editing');
    td.classList.add('td-saving');

    // Show the new value immediately (optimistic update)
    if (field === 'pipeline_status') {
      td.innerHTML = getStageBadgeHtml(newValue);
    } else if (field === 'name') {
      td.innerHTML = newValue ? `<strong>${escapeHtml(newValue)}</strong>` : '<span class="td-empty-placeholder">+</span>';
    } else if (field === 'address_full') {
      td.innerHTML = newValue ? escapeHtml(extractCity(newValue)) : '<span class="td-empty-placeholder">+</span>';
    } else {
      td.innerHTML = newValue ? escapeHtml(newValue) : '<span class="td-empty-placeholder">+</span>';
    }

    try {
      const payload = { businessId: businessId };
      payload[field] = newValue;

      const res = await fetch('/api/businesses/update-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed');

      // Update data-value attribute
      td.setAttribute('data-value', newValue);
      td.setAttribute('title', newValue ? t('clickToEdit') : t('clickToAdd'));

      // Update local data
      const business = allBusinesses.find(b => String(b.id) === String(businessId));
      if (business) {
        business[field] = newValue;
        // Also update in currentResults
        const cr = currentResults.find(b => String(b.id) === String(businessId));
        if (cr) cr[field] = newValue;
      }

      // If pipeline_status changed, update counts
      if (field === 'pipeline_status') {
        updatePipelineCounts(allBusinesses);
      }

      // Brief success flash
      td.classList.add('td-save-success');
      setTimeout(() => td.classList.remove('td-save-success'), 1200);

      showToast(t('inlineEditSaved'), 'success');
    } catch (err) {
      console.error('Inline edit save error:', err);
      // Revert to original value
      td.setAttribute('data-value', originalValue);
      if (field === 'pipeline_status') {
        td.innerHTML = getStageBadgeHtml(originalValue);
      } else if (field === 'name') {
        td.innerHTML = originalValue ? `<strong>${escapeHtml(originalValue)}</strong>` : '<span class="td-empty-placeholder">+</span>';
      } else if (field === 'address_full') {
        td.innerHTML = originalValue ? escapeHtml(extractCity(originalValue)) : '<span class="td-empty-placeholder">+</span>';
      } else {
        td.innerHTML = originalValue ? escapeHtml(originalValue) : '<span class="td-empty-placeholder">+</span>';
      }
      showToast(t('inlineEditError'), 'error');
    } finally {
      td.classList.remove('td-saving');
    }
  }

  // ── Pagination ──
  function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    pageInfo.textContent = t('pageInfo', currentPage + 1, totalPages);
    btnPrev.disabled = currentPage === 0;
    btnNext.disabled = currentPage >= totalPages - 1;
  }

  // ── Detail Modal ──
  async function openDetailModal(business) {
    // Remove existing modal if any
    const existing = document.getElementById('detail-modal');
    if (existing) existing.remove();

    // Load full details (reviews, photos) if not cached
    let details = detailCache[business.id];
    if (!details) {
      try {
        const [reviewsRes, photosRes] = await Promise.all([
          supabaseClient.from('business_reviews').select('*').eq('business_id', business.id).order('sentiment_score', { ascending: false, nullsFirst: false }).limit(20),
          supabaseClient.from('business_photos').select('*').eq('business_id', business.id).limit(30),
        ]);
        details = {
          reviews: reviewsRes.data || [],
          photos: photosRes.data || [],
        };
        detailCache[business.id] = details;
      } catch (err) {
        console.error('Detail load error:', err);
        details = { reviews: [], photos: [] };
      }
    }

    const profiles = business.business_social_profiles || [];
    const allReviews = details.reviews;
    const googleReviews = allReviews.filter(r => r.source === 'google');
    const fbReviews = allReviews.filter(r => r.source === 'facebook');
    const photos = details.photos;

    // Star rating display
    const starsHtml = renderStars(business.rating);

    // Build description HTML
    let descriptionHtml = '';
    if (business.description) {
      descriptionHtml = `
        <div class="modal-section">
          <h3>${t('modalDescription')}</h3>
          <p class="business-description-text">${escapeHtml(business.description)}</p>
        </div>
      `;
    }

    // Build price level HTML
    let priceHtml = '';
    if (business.price_level) {
      const priceDisplay = '$'.repeat(business.price_level);
      priceHtml = `<span class="meta-sep">|</span><span>${escapeHtml(priceDisplay)}</span>`;
    }

    // Build photo gallery HTML
    let photosHtml = '';
    if (photos.length > 0) {
      const imgs = photos.map(p => `<div class="photo-item"><img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption || '')}" loading="lazy"></div>`).join('');
      photosHtml = `<div class="modal-section"><h3>${t('modalPhotos')}</h3><div class="photo-gallery">${imgs}</div></div>`;
    }

    // Build service options HTML
    let serviceOptionsHtml = '';
    if (business.service_options && business.service_options.length > 0) {
      const tags = business.service_options.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('');
      serviceOptionsHtml = `<div class="modal-section"><h3>${t('modalServiceOptions')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build highlights HTML
    let highlightsHtml = '';
    if (business.highlights && business.highlights.length > 0) {
      const tags = business.highlights.map(f => `<span class="feature-tag feature-tag-highlight">${escapeHtml(f)}</span>`).join('');
      highlightsHtml = `<div class="modal-section"><h3>${t('modalHighlights')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build amenities HTML
    let amenitiesHtml = '';
    if (business.amenities && business.amenities.length > 0) {
      const tags = business.amenities.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('');
      amenitiesHtml = `<div class="modal-section"><h3>${t('modalAmenities')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build accessibility HTML
    let accessibilityHtml = '';
    if (business.accessibility_info) {
      // accessibility_info is TEXT in DB, may be comma-separated or a single string
      const items = business.accessibility_info.split(',').map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        const tags = items.map(f => `<span class="feature-tag feature-tag-accessibility">${escapeHtml(f)}</span>`).join('');
        accessibilityHtml = `<div class="modal-section"><h3>${t('modalAccessibility')}</h3><div class="features-grid">${tags}</div></div>`;
      }
    }

    // Build review histogram HTML
    let histogramHtml = '';
    if (googleReviews.length > 0) {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      googleReviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating]++; });
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total > 0) {
        const rows = [5, 4, 3, 2, 1].map(star => {
          const count = counts[star];
          const pct = Math.round((count / total) * 100);
          return `
            <div class="histogram-row">
              <span class="histogram-star">${star}</span>
              <div class="histogram-bar-track">
                <div class="histogram-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="histogram-count">${count}</span>
            </div>
          `;
        }).join('');
        histogramHtml = `<div class="modal-section"><h3>${t('modalReviewBreakdown')}</h3><div class="review-histogram">${rows}</div></div>`;
      }
    }

    // Build reviews HTML with sentiment badges (matching search modal style)
    let reviewsHtml = '';
    // Sort by sentiment score desc for "top reviews"
    const topReviews = [...allReviews].sort((a, b) => (b.sentiment_score || 0) - (a.sentiment_score || 0)).slice(0, 10);
    if (topReviews.length > 0) {
      const reviewItems = topReviews.map(r => {
        const stars = '\u2605'.repeat(Math.floor(r.rating || 0)) + '\u2606'.repeat(5 - Math.floor(r.rating || 0));
        const label = r.sentiment_label || '';
        const sentimentBadge = label === 'very_positive'
          ? `<span class="sentiment-badge sentiment-great">${t('topPick')}</span>`
          : label === 'positive'
          ? `<span class="sentiment-badge sentiment-good">${t('good')}</span>`
          : '';
        const authorName = r.author_name || t('anonymous');
        const timeAgo = r.published_at || '';
        return `
          <div class="review-card">
            <div class="review-header">
              <div class="review-author">
                ${r.author_photo_url ? `<img src="${escapeHtml(r.author_photo_url)}" alt="" class="review-avatar">` : '<div class="review-avatar-placeholder"></div>'}
                <div>
                  <strong>${escapeHtml(authorName)}</strong>
                  ${r.source !== 'google' ? `<span class="review-source-badge">${escapeHtml(r.source)}</span>` : ''}
                  <span class="review-time">${escapeHtml(timeAgo)}</span>
                </div>
              </div>
              <div class="review-meta">
                <span class="stars">${stars}</span>
                ${sentimentBadge}
              </div>
            </div>
            <p class="review-text">${escapeHtml(r.text || '')}</p>
          </div>
        `;
      }).join('');
      reviewsHtml = `
        <div class="modal-section">
          <h3>${t('topReviewsTitle')} (${allReviews.length})</h3>
          <p class="section-subtitle">${t('topReviewsSubtitle')}</p>
          <div class="reviews-list">${reviewItems}</div>
        </div>
      `;
    } else {
      reviewsHtml = `
        <div class="modal-section">
          <h3>${t('topReviewsTitle')}</h3>
          <p class="section-subtitle" style="color:var(--text-dim)">${t('noReviewsAvailable')}</p>
        </div>
      `;
    }

    // Build hours HTML
    let hoursHtml = '';
    if (business.hours && business.hours.length > 0) {
      const hourItems = business.hours.map(h => `<li>${escapeHtml(h)}</li>`).join('');
      hoursHtml = `<div class="modal-section"><h3>${t('modalHours')}</h3><ul class="hours-list">${hourItems}</ul></div>`;
    }

    // Build categories HTML
    let typesHtml = '';
    if (business.types && business.types.length > 0) {
      const tags = business.types.map(ty => `<span class="feature-tag">${escapeHtml(ty.replace(/_/g, ' '))}</span>`).join('');
      typesHtml = `<div class="modal-section"><h3>${t('modalTypes')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build social profiles HTML
    let socialHtml = '';
    if (profiles.length > 0) {
      const items = profiles.map(p => {
        const icon = SOCIAL_ICONS[p.platform] || '';
        const color = SOCIAL_COLORS[p.platform] || 'var(--text-muted)';
        const emoji = SOCIAL_PLATFORM_EMOJIS[p.platform] || '\uD83C\uDF10';
        const iconHtml = icon ? `<span style="color:${color}">${icon}</span>` : emoji;
        return `<a href="${escapeHtml(p.url || '#')}" target="_blank" rel="noopener" class="social-profile-item">
          ${iconHtml}
          <span style="text-transform:capitalize;font-weight:600">${escapeHtml(p.platform)}</span>
          ${p.handle ? `<span style="color:var(--text-muted)">@${escapeHtml(p.handle)}</span>` : ''}
          ${p.follower_count ? `<span style="color:var(--text-muted)">${p.follower_count.toLocaleString()} followers</span>` : ''}
          ${p.post_count ? `<span style="color:var(--text-muted)">${p.post_count.toLocaleString()} posts</span>` : ''}
        </a>`;
      }).join('');
      socialHtml = `<div class="modal-section"><h3>${t('modalSocialProfiles')}</h3><div class="social-profiles-list">${items}</div></div>`;
    }

    // Check if there's already a generated website
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.html);
    const reportRecord = (business.generated_websites || []).find(w => w.config && w.config.researchReport);
    const hasReport = !!reportRecord || !!business._cachedReport;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'detail-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>${escapeHtml(business.name)}</h2>
            <p class="modal-address">${escapeHtml(business.address_full || '')}${business.business_code ? ` <span style="color:var(--text-dim);font-family:monospace;font-size:12px">${escapeHtml(business.business_code)}</span>` : ''}</p>
            <div class="modal-meta">
              <span class="stars">${starsHtml}</span>
              <span>${business.rating ? business.rating.toFixed(1) : 'N/A'}</span>
              <span class="meta-sep">|</span>
              <span>${business.review_count ? business.review_count.toLocaleString() + ' ' + t('reviews') : t('noReviews')}</span>
              ${priceHtml}
              ${business.phone ? `<span class="meta-sep">|</span><span>${escapeHtml(business.phone)}</span>` : ''}
            </div>
          </div>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Pipeline Status -->
          <div class="contact-edit-section">
            <h3>${t('pipelineContactSection')}</h3>
            <div class="contact-edit-grid">
              <div class="form-group">
                <label>${t('pipelineStage')}</label>
                <select class="input" id="modal-pipeline-status">
                  <option value="saved" ${(business.pipeline_status || 'saved') === 'saved' ? 'selected' : ''}>${t('stageSaved')}</option>
                  <option value="lead" ${business.pipeline_status === 'lead' ? 'selected' : ''}>${t('stageLead')}</option>
                  <option value="demo" ${business.pipeline_status === 'demo' ? 'selected' : ''}>${t('stageDemo')}</option>
                  <option value="active_customer" ${business.pipeline_status === 'active_customer' ? 'selected' : ''}>${t('stageActiveCustomer')}</option>
                  <option value="inactive_customer" ${business.pipeline_status === 'inactive_customer' ? 'selected' : ''}>${t('stageInactiveCustomer')}</option>
                </select>
              </div>
            </div>
            <div class="contact-edit-actions">
              <button class="btn btn-primary btn-sm" id="modal-save-pipeline">${t('pipelineSaveBtn')}</button>
            </div>
          </div>

          <!-- Business Notes -->
          <div class="modal-section">
            <h3>${t('businessNotes')}</h3>
            <textarea class="input" id="modal-business-notes" rows="3" placeholder="${t('businessNotesPlaceholder')}" style="width:100%;resize:vertical">${escapeHtml(business.notes || '')}</textarea>
            <div style="margin-top:8px">
              <button class="btn btn-primary btn-sm" id="modal-save-notes">${t('pipelineSaveBtn')}</button>
            </div>
          </div>

          <!-- Contacts -->
          <div class="modal-section">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <h3 style="margin:0">${t('thContacts')}</h3>
              <button class="btn btn-primary btn-sm" id="modal-add-contact">${t('addContact')}</button>
            </div>
            <div id="modal-contacts-list">
              <p style="color:var(--text-muted)">${t('noContacts')}</p>
            </div>
            <div id="modal-contact-form" style="display:none">
              <div class="contact-edit-grid" style="margin-top:12px">
                <div class="form-group">
                  <label>${t('contactName')}</label>
                  <input type="text" class="input" id="cf-name" placeholder="${t('contactName')}">
                </div>
                <div class="form-group">
                  <label>${t('contactTitle')}</label>
                  <input type="text" class="input" id="cf-title" placeholder="${t('contactTitlePlaceholder')}">
                </div>
                <div class="form-group">
                  <label>${t('thContactWhatsapp')}</label>
                  <input type="text" class="input" id="cf-whatsapp" placeholder="${t('thContactWhatsapp')}">
                </div>
                <div class="form-group">
                  <label>${t('contactEmail')}</label>
                  <input type="email" class="input" id="cf-email" placeholder="${t('contactEmail')}">
                </div>
                <div class="form-group">
                  <label style="display:flex;align-items:center;gap:6px">
                    <input type="checkbox" id="cf-primary"> ${t('contactIsPrimary')}
                  </label>
                </div>
              </div>
              <div class="form-group" style="margin-top:8px">
                <label>${t('contactNotes')}</label>
                <textarea class="input" id="cf-notes" rows="2" style="width:100%;resize:vertical"></textarea>
              </div>
              <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn btn-primary btn-sm" id="cf-save">${t('pipelineSaveBtn')}</button>
                <button class="btn btn-secondary btn-sm" id="cf-cancel">${t('closeBtn')}</button>
              </div>
              <input type="hidden" id="cf-contact-id" value="">
            </div>
          </div>

          ${descriptionHtml}
          ${photosHtml}
          ${serviceOptionsHtml}
          ${highlightsHtml}
          ${amenitiesHtml}
          ${accessibilityHtml}
          ${typesHtml}
          ${histogramHtml}
          ${reviewsHtml}
          ${hoursHtml}
          ${socialHtml}

          <!-- Research Report -->
          <div class="modal-section" id="research-report-section">
            <h3>${t('generateReport')}</h3>
            <button class="btn btn-primary" id="generate-report-btn">${hasReport ? t('badgeYes') + ' — View Report' : t('generateReport')}</button>
            <div id="research-report-container"></div>
          </div>

          <!-- Website Generation -->
          <div class="modal-section" id="website-generation-section" style="${hasReport ? '' : 'display:none'}">
            <h3>${t('websiteGenTitle')}</h3>
            <button class="btn btn-primary" id="generate-website-btn">${existingWebsite ? 'View Website' : t('generateWebsite')}</button>
            <div id="website-generation-container"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-copy-reviews">${t('copyTopReviews')}</button>
          <button class="btn btn-primary" id="modal-close-btn-footer">${t('closeBtn')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('#modal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('#modal-close-btn-footer').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        const m = document.getElementById('detail-modal');
        if (m) m.remove();
        document.removeEventListener('keydown', handler);
      }
    });

    // Save pipeline status
    modal.querySelector('#modal-save-pipeline').addEventListener('click', async () => {
      const btn = modal.querySelector('#modal-save-pipeline');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = t('pipelineSaving');

      const payload = {
        businessId: business.id,
        pipeline_status: modal.querySelector('#modal-pipeline-status').value,
      };

      try {
        const res = await fetch('/api/businesses/update-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed');

        // Update local business object so table re-renders correctly
        business.pipeline_status = payload.pipeline_status;

        // Update allBusinesses too
        const idx = allBusinesses.findIndex(b => b.id === business.id);
        if (idx >= 0) {
          allBusinesses[idx].pipeline_status = payload.pipeline_status;
        }

        // Re-apply pipeline counts and filter
        updatePipelineCounts(allBusinesses);
        applyPipelineFilter(pipelineStage);

        showToast(t('pipelineChangeSuccess'), 'success');
      } catch (err) {
        console.error('Pipeline update error:', err);
        showToast(t('pipelineChangeError'), 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });

    // ── Save Business Notes ──
    modal.querySelector('#modal-save-notes').addEventListener('click', async () => {
      const btn = modal.querySelector('#modal-save-notes');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = t('pipelineSaving');

      const notesValue = modal.querySelector('#modal-business-notes').value.trim();
      try {
        const res = await fetch('/api/businesses/update-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: business.id, notes: notesValue }),
        });
        if (!res.ok) throw new Error('Failed');

        business.notes = notesValue;
        const idx = allBusinesses.findIndex(b => b.id === business.id);
        if (idx >= 0) allBusinesses[idx].notes = notesValue;

        showToast(t('businessNotesSaved'), 'success');
      } catch (err) {
        console.error('Save notes error:', err);
        showToast(t('pipelineChangeError'), 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });

    // ── Contacts Management ──
    const contactsList = modal.querySelector('#modal-contacts-list');
    const contactForm = modal.querySelector('#modal-contact-form');

    function renderContactsList(contacts) {
      if (!contacts || contacts.length === 0) {
        contactsList.innerHTML = `<p style="color:var(--text-muted)">${t('noContacts')}</p>`;
        return;
      }
      contactsList.innerHTML = contacts.map(c => `
        <div class="contact-card" data-contact-id="${c.id}" style="background:var(--bg-input);border-radius:var(--radius);padding:12px;margin-bottom:8px;position:relative">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <strong>${escapeHtml(c.contact_name || '(unnamed)')}</strong>
            ${c.contact_title ? `<span style="color:var(--text-muted);font-size:12px">${escapeHtml(c.contact_title)}</span>` : ''}
            ${c.is_primary ? `<span class="badge badge-saved" style="font-size:10px;padding:2px 6px">${t('contactIsPrimary')}</span>` : ''}
            <span style="color:var(--text-dim);font-size:11px;font-family:monospace;margin-left:auto">${escapeHtml(c.contact_code || '')}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:12px">
            ${(c.contact_whatsapp || c.contact_phone) ? `<span>WA: ${escapeHtml(c.contact_whatsapp || c.contact_phone)}</span>` : ''}
            ${c.contact_email ? `<span>Email: ${escapeHtml(c.contact_email)}</span>` : ''}
          </div>
          ${c.notes ? `<div style="font-size:12px;color:var(--text-dim);margin-top:4px;font-style:italic">${escapeHtml(c.notes)}</div>` : ''}
          <div style="position:absolute;top:8px;right:8px;display:flex;gap:4px">
            <button class="btn btn-text btn-sm contact-edit-btn" data-contact-id="${c.id}" style="font-size:11px;padding:2px 8px">${t('editContact')}</button>
            <button class="btn btn-text btn-sm contact-delete-btn" data-contact-id="${c.id}" style="font-size:11px;padding:2px 8px;color:var(--danger)">${t('deleteContact')}</button>
          </div>
        </div>
      `).join('');

      // Bind edit buttons
      contactsList.querySelectorAll('.contact-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const contactId = btn.getAttribute('data-contact-id');
          const contact = (business.business_contacts || []).find(c => String(c.id) === contactId);
          if (contact) openContactForm(contact);
        });
      });

      // Bind delete buttons
      contactsList.querySelectorAll('.contact-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(t('deleteContactConfirm'))) return;
          const contactId = btn.getAttribute('data-contact-id');
          try {
            const res = await fetch('/api/contacts/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contactId, businessId: business.id }),
            });
            if (!res.ok) throw new Error('Failed');

            // Remove from local data
            business.business_contacts = (business.business_contacts || []).filter(c => String(c.id) !== contactId);
            const idx = allBusinesses.findIndex(b => b.id === business.id);
            if (idx >= 0) allBusinesses[idx].business_contacts = business.business_contacts;

            renderContactsList(business.business_contacts);
            applyPipelineFilter(pipelineStage);
            showToast(t('contactDeleted'), 'success');
          } catch (err) {
            console.error('Delete contact error:', err);
            showToast(t('contactDeleteError'), 'error');
          }
        });
      });
    }

    function openContactForm(contact) {
      contactForm.style.display = '';
      modal.querySelector('#cf-contact-id').value = contact ? contact.id : '';
      modal.querySelector('#cf-name').value = contact ? (contact.contact_name || '') : '';
      modal.querySelector('#cf-title').value = contact ? (contact.contact_title || '') : '';
      modal.querySelector('#cf-whatsapp').value = contact ? (contact.contact_whatsapp || contact.contact_phone || '') : '';
      modal.querySelector('#cf-email').value = contact ? (contact.contact_email || '') : '';
      modal.querySelector('#cf-notes').value = contact ? (contact.notes || '') : '';
      modal.querySelector('#cf-primary').checked = contact ? !!contact.is_primary : false;
      modal.querySelector('#cf-name').focus();
    }

    function closeContactForm() {
      contactForm.style.display = 'none';
      modal.querySelector('#cf-contact-id').value = '';
    }

    // Add contact button
    modal.querySelector('#modal-add-contact').addEventListener('click', () => openContactForm(null));

    // Cancel contact form
    modal.querySelector('#cf-cancel').addEventListener('click', () => closeContactForm());

    // Save contact form
    modal.querySelector('#cf-save').addEventListener('click', async () => {
      const btn = modal.querySelector('#cf-save');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = t('pipelineSaving');

      const contactId = modal.querySelector('#cf-contact-id').value || null;
      const payload = {
        businessId: business.id,
        contactId: contactId ? parseInt(contactId, 10) : undefined,
        contact_name: modal.querySelector('#cf-name').value.trim(),
        contact_title: modal.querySelector('#cf-title').value.trim(),
        contact_phone: modal.querySelector('#cf-whatsapp').value.trim(),
        contact_email: modal.querySelector('#cf-email').value.trim(),
        contact_whatsapp: modal.querySelector('#cf-whatsapp').value.trim(),
        notes: modal.querySelector('#cf-notes').value.trim(),
        is_primary: modal.querySelector('#cf-primary').checked,
      };

      try {
        const res = await fetch('/api/contacts/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const savedContact = data.contact;

        // Update local data
        if (!business.business_contacts) business.business_contacts = [];

        if (contactId) {
          // Update existing
          const ci = business.business_contacts.findIndex(c => String(c.id) === contactId);
          if (ci >= 0) business.business_contacts[ci] = savedContact;
        } else {
          // Add new
          business.business_contacts.push(savedContact);
        }

        // If this was set as primary, unmark others locally
        if (payload.is_primary) {
          business.business_contacts.forEach(c => {
            if (String(c.id) !== String(savedContact.id)) c.is_primary = false;
          });
        }

        const idx = allBusinesses.findIndex(b => b.id === business.id);
        if (idx >= 0) allBusinesses[idx].business_contacts = business.business_contacts;

        renderContactsList(business.business_contacts);
        closeContactForm();
        applyPipelineFilter(pipelineStage);
        showToast(t('contactSaved'), 'success');
      } catch (err) {
        console.error('Save contact error:', err);
        showToast(t('contactError'), 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });

    // Initial render of contacts
    renderContactsList(business.business_contacts || []);

    // Copy top reviews button
    modal.querySelector('#modal-copy-reviews').addEventListener('click', () => {
      const reviewTexts = topReviews.map(r => {
        const authorName = r.author_name || t('anonymous');
        const stars = '\u2605'.repeat(r.rating || 0);
        return `${stars} — ${authorName}\n"${r.text || ''}"`;
      }).join('\n\n');
      navigator.clipboard.writeText(reviewTexts).then(() => {
        showToast(t('copyTopReviews') + ' \u2713', 'success');
      });
    });

    // Report button
    const reportBtn = modal.querySelector('#generate-report-btn');
    reportBtn.addEventListener('click', () => {
      generateResearchReport(modal, business, details, reportBtn);
    });

    // If report already exists, auto-render it
    if (hasReport) {
      const reportData = business._cachedReport || (reportRecord && reportRecord.config.researchReport);
      if (reportData) renderResearchReport(modal, reportData);
      reportBtn.style.display = 'none';
    }

    // Website button
    const websiteBtn = modal.querySelector('#generate-website-btn');
    websiteBtn.addEventListener('click', () => {
      generateWebsite(modal, business, details, websiteBtn);
    });

    // If website already exists, auto-render preview
    if (existingWebsite && existingWebsite.config && existingWebsite.config.html) {
      renderWebsitePreview(modal, existingWebsite.config.html, business);
      websiteBtn.style.display = 'none';
    }
  }

  // ── Compile Business Data for Prompt ──
  function compileBusinessDataForPrompt(business, details) {
    const sections = [];
    const profiles = business.business_social_profiles || [];
    const reviews = details.reviews || [];
    const photos = details.photos || [];

    sections.push('=== BUSINESS IDENTITY ===');
    sections.push(`Name: ${business.name}`);
    sections.push(`Address: ${business.address_full || ''}`);
    if (business.phone) sections.push(`Phone: ${business.phone}`);
    if (business.types && business.types.length > 0) sections.push(`Categories: ${business.types.join(', ')}`);
    if (business.business_status) sections.push(`Status: ${business.business_status}`);

    // Business details
    const detailFields = [
      ['Description', business.description],
      ['Price Level', business.price_level ? '$'.repeat(business.price_level) : null],
      ['Service Options', business.service_options?.join(', ')],
      ['Amenities', business.amenities?.join(', ')],
      ['Highlights', business.highlights?.join(', ')],
      ['Payment Methods', business.payment_methods?.join(', ')],
      ['Languages Spoken', business.languages_spoken?.join(', ')],
      ['Accessibility', business.accessibility_info],
      ['Parking', business.parking_info],
      ['Year Established', business.year_established],
      ['Owner', business.owner_name],
    ];
    const activeDetails = detailFields.filter(([, v]) => v);
    if (activeDetails.length > 0) {
      sections.push('\n=== BUSINESS DETAILS ===');
      activeDetails.forEach(([label, val]) => sections.push(`${label}: ${val}`));
    }

    sections.push('\n=== RATINGS & REVIEWS OVERVIEW ===');
    sections.push(`Google Rating: ${business.rating || 'N/A'} / 5`);
    sections.push(`Total Reviews: ${business.review_count || 0}`);

    // Google reviews
    const googleReviews = reviews.filter(r => r.source === 'google');
    if (googleReviews.length > 0) {
      sections.push('\n=== GOOGLE REVIEWS ===');
      googleReviews.slice(0, 15).forEach((r, i) => {
        sections.push(`Review ${i + 1} (${r.rating}★ by ${r.author_name || 'Anonymous'}): "${r.text}"`);
      });
    }

    // Facebook reviews
    const fbReviews = reviews.filter(r => r.source === 'facebook');
    if (fbReviews.length > 0) {
      sections.push('\n=== FACEBOOK REVIEWS ===');
      fbReviews.slice(0, 5).forEach((r, i) => {
        sections.push(`FB Review ${i + 1} (${r.rating || 'N/A'}★ by ${r.author_name || 'Anonymous'}): "${r.text}"`);
      });
    }

    // Hours
    if (business.hours && business.hours.length > 0) {
      sections.push('\n=== BUSINESS HOURS ===');
      business.hours.forEach(h => sections.push(h));
    }

    // Social profiles
    if (profiles.length > 0) {
      sections.push('\n=== SOCIAL MEDIA PROFILES ===');
      profiles.forEach(sp => {
        let line = `${sp.platform}: ${sp.url || ''}`;
        if (sp.handle) line += ` (@${sp.handle})`;
        if (sp.follower_count) line += ` | ${sp.follower_count} followers`;
        if (sp.post_count) line += ` | ${sp.post_count} posts`;
        sections.push(line);
      });
    }

    // Photo inventory
    if (photos.length > 0) {
      sections.push('\n=== PHOTO INVENTORY ===');
      sections.push(`Total Photos Available: ${photos.length}`);
      photos.forEach((p, i) => {
        let line = `ID: ${p.source}_photo_${i} | Source: ${p.source} | Type: ${p.photo_type || 'unclassified'}`;
        if (p.caption) line += ` | Caption: "${p.caption.substring(0, 150)}"`;
        sections.push(line);
      });
    }

    return sections.join('\n');
  }

  // ── Build Photo Inventory ──
  function buildPhotoInventory(details) {
    const photos = details.photos || [];
    return photos.map((p, i) => ({
      id: `${p.source}_photo_${i}`,
      source: p.source,
      type: p.photo_type || 'unclassified',
      url: p.url,
    }));
  }

  // ── Build Photo Manifest ──
  function buildPhotoManifest(photoAssetPlan, photoInventory) {
    const usedUrls = new Set();
    const manifest = [];

    for (const item of photoAssetPlan) {
      let url = null;

      if (item.recommendation === 'use_existing' && item.existingPhotoId) {
        const match = photoInventory.find(p => p.id === item.existingPhotoId);
        url = match?.url || null;
      }

      if (!url && item.recommendation === 'generate_ai') {
        const section = (item.section || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const match = photoInventory.find(p => p.id.startsWith(`ai_${section}_`));
        url = match?.url || null;
      }

      // Fallback: any unused photo
      if (!url) {
        const fallback = photoInventory.find(p => !usedUrls.has(p.url));
        url = fallback?.url || (photoInventory[0]?.url || null);
      }

      if (url) {
        usedUrls.add(url);
        manifest.push({ section: item.section, slot: item.slot, url });
      }
    }

    return manifest;
  }

  // ── Table Action Handlers ──
  async function loadDetailsForBusiness(business) {
    let details = detailCache[business.id];
    if (!details) {
      try {
        const [reviewsRes, photosRes] = await Promise.all([
          supabaseClient.from('business_reviews').select('*').eq('business_id', business.id).order('sentiment_score', { ascending: false, nullsFirst: false }).limit(20),
          supabaseClient.from('business_photos').select('*').eq('business_id', business.id).limit(30),
        ]);
        details = { reviews: reviewsRes.data || [], photos: photosRes.data || [] };
        detailCache[business.id] = details;
      } catch (err) {
        console.error('Detail load error:', err);
        details = { reviews: [], photos: [] };
      }
    }
    return details;
  }

  // ── Report Modal (lightweight) ──
  function openReportModal(business) {
    const reportRecord = (business.generated_websites || []).find(w => w.config && w.config.researchReport);
    const report = business._cachedReport || (reportRecord && reportRecord.config.researchReport);
    if (!report) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'report-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>${t('reportModalTitle')}</h2>
            <p class="modal-address">${escapeHtml(business.name)}</p>
          </div>
          <button class="modal-close" id="report-modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div id="report-modal-container"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="report-modal-regenerate">${t('regenerateReport')}</button>
          <button class="btn btn-primary" id="report-modal-close-footer">${t('closeBtn')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Render report content reusing existing renderer
    renderResearchReport(modal, report, '#report-modal-container');

    modal.querySelector('#report-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#report-modal-close-footer').addEventListener('click', () => modal.remove());
    modal.querySelector('#report-modal-regenerate').addEventListener('click', () => {
      modal.remove();
      // Clear cached report so handleAdminTableReport runs the generation flow
      business._cachedReport = null;
      // Also clear the report from generated_websites so it doesn't short-circuit
      if (business.generated_websites) {
        business.generated_websites = business.generated_websites.filter(w => !(w.config && w.config.researchReport));
      }
      // Find the report button in the table row and trigger generation
      const rows = document.querySelectorAll('.results-table tbody tr');
      for (const row of rows) {
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell && nameCell.textContent.trim() === business.name) {
          const reportBtn = row.querySelector('.btn-report');
          if (reportBtn) {
            reportBtn.textContent = t('btnReport');
            handleAdminTableReport(business, reportBtn);
          }
          break;
        }
      }
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        const m = document.getElementById('report-modal');
        if (m) m.remove();
        document.removeEventListener('keydown', handler);
      }
    });
  }

  // ── AI Photos Modal (lightweight) ──
  function openAiPhotosModal(business) {
    const photos = business._cachedGeneratedPhotos || [];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'ai-photos-modal';

    let photosHtml = '';
    if (photos.length === 0) {
      photosHtml = `<p style="color:var(--text-muted);text-align:center;padding:24px">${t('aiPhotosEmpty')}</p>`;
    } else {
      const items = photos.map(p => `
        <div class="ai-photo-item">
          <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener"><img src="${escapeHtml(p.url)}" alt="${escapeHtml((p.section || '') + ' — ' + (p.slot || ''))}" loading="lazy" style="width:100%;border-radius:var(--radius);cursor:pointer"></a>
          <p style="margin:6px 0 0;font-size:12px;color:var(--text-muted)"><strong>${t('aiPhotosSection')}:</strong> ${escapeHtml(p.section || '—')} — ${escapeHtml(p.slot || '—')}</p>
        </div>
      `).join('');
      photosHtml = `<div class="photo-gallery" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">${items}</div>`;
    }

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>${t('aiPhotosModalTitle')}</h2>
            <p class="modal-address">${escapeHtml(business.name)}</p>
          </div>
          <button class="modal-close" id="ai-photos-modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${photosHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="ai-photos-modal-regenerate">${t('regeneratePhotos')}</button>
          <button class="btn btn-primary" id="ai-photos-modal-close-footer">${t('closeBtn')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#ai-photos-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#ai-photos-modal-close-footer').addEventListener('click', () => modal.remove());
    modal.querySelector('#ai-photos-modal-regenerate').addEventListener('click', () => {
      modal.remove();
      // Clear cached photos so handleAdminTableAiPhotos runs the generation flow
      business._cachedGeneratedPhotos = null;
      // Find the photos button in the table row and trigger generation
      const rows = document.querySelectorAll('.results-table tbody tr');
      for (const row of rows) {
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell && nameCell.textContent.trim() === business.name) {
          const photosBtn = row.querySelector('.btn-photos');
          if (photosBtn) {
            photosBtn.textContent = t('btnPhotos');
            handleAdminTableAiPhotos(business, photosBtn);
          }
          break;
        }
      }
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        const m = document.getElementById('ai-photos-modal');
        if (m) m.remove();
        document.removeEventListener('keydown', handler);
      }
    });
  }

  async function deleteBusiness(businessId, businessName) {
    if (!confirm(t('deleteConfirm', businessName))) return;
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) {
        console.error('Delete business error:', error);
        showToast(t('deleteError'), 'error');
        return;
      }

      showToast(t('deleteSuccess', businessName), 'success');
      // Remove from current results and re-render
      currentResults = currentResults.filter(b => String(b.id) !== String(businessId));
      totalCount = Math.max(0, totalCount - 1);
      renderTable();
    } catch (err) {
      console.error('Delete business error:', err);
      showToast(t('deleteError'), 'error');
    }
  }

  async function handleEnrich(business, btn) {
    const placeId = business.place_id;
    if (!placeId || placeId.startsWith('marketing-')) {
      showToast(t('enrichNoPlaceId'), 'error');
      return;
    }
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = t('enriching');
    try {
      const res = await fetch('/api/enrich/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      btn.textContent = '\u2713';
      btn.disabled = false;
      showToast(t('enrichSuccess', business.name), 'success');
    } catch (err) {
      console.error('Enrich failed:', err);
      btn.textContent = origText;
      btn.disabled = false;
      showToast(t('enrichError'), 'error');
    }
  }

  async function handleAdminTableReport(business, btn) {
    const existingReport = (business.generated_websites || []).find(w => w.config && w.config.researchReport);
    if (existingReport || business._cachedReport) {
      openReportModal(business);
      return;
    }

    const popup = showPipelinePopup(business.name);
    btn.disabled = true;
    btn.textContent = t('generatingReport');

    // Step 1: Report
    popup.setStep('report', 'running');
    try {
      const details = await loadDetailsForBusiness(business);
      const businessData = compileBusinessDataForPrompt(business, details);
      const language = business.address_country === 'MX' || business.address_country === 'CO' ? 'es' : 'en';
      const res = await withTimeout(
        fetch('/api/ai/research-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessData, name: business.name, language }),
        }),
        310000,
        'Research report'
      );
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let errMsg = 'Request failed';
        try { errMsg = JSON.parse(errText).error || errMsg; } catch (e) {}
        console.error('Research report API error:', res.status, errMsg);
        throw new Error(errMsg);
      }
      const data = await parseSSEReportResponse(res);
      if (data.parseError) throw new Error('Failed to parse report response');
      business._cachedReport = data;
      popup.setStep('report', 'done');
      btn.disabled = false;
      btn.textContent = '\u2713';
      btn.title = t('generateReport');
      // Enable photos and website buttons in same row
      const row = btn.closest('tr');
      const photosBtn = row ? row.querySelector('.btn-photos') : null;
      if (photosBtn) photosBtn.disabled = false;
      const websiteBtn = row ? row.querySelector('.btn-website') : null;
      if (websiteBtn) websiteBtn.disabled = false;
      // Persist report to database
      saveResearchReport(business, data).catch(err =>
        console.warn('Failed to save research report:', err)
      );
    } catch (err) {
      console.error('Research report error:', err);
      popup.setStep('report', 'error');
      popup.showClose();
      btn.disabled = false;
      btn.textContent = t('btnReport');
      return;
    }

    // Photos and website are triggered manually via their own buttons
    popup.showClose();
    showToast(t('reportSuccess', business.name), 'success');
  }

  async function handleAdminTableAiPhotos(business, btn) {
    // If already generated, open AI photos modal to view them
    if (business._cachedGeneratedPhotos) {
      openAiPhotosModal(business);
      return;
    }

    const report = business._cachedReport ||
      ((business.generated_websites || []).find(w => w.config && w.config.researchReport) || {}).config?.researchReport;
    if (!report) {
      showToast(t('needsReport'), 'warning');
      return;
    }

    const plan = report.photoAssetPlan || [];
    const aiItems = plan.filter(item => item.recommendation === 'generate_ai' && item.aiPrompt);

    // If no AI photos needed, mark as complete
    if (aiItems.length === 0) {
      business._cachedGeneratedPhotos = [];
      if (btn) { btn.textContent = '\u2713'; }
      showToast(t('photosNoneNeeded'), 'success');
      const row = btn ? btn.closest('tr') : null;
      const websiteBtn = row ? row.querySelector('.btn-website') : null;
      if (websiteBtn) websiteBtn.disabled = false;
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = t('generatingPhotos');
    }

    try {
      // Fire all photo generation requests in parallel
      const results = await Promise.allSettled(
        aiItems.map((item, i) =>
          withTimeout(
            fetch('/api/ai/generate-photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: item.aiPrompt,
                section: item.section,
                slot: item.slot,
              }),
            }),
            30000,
            'Photo generation'
          ).then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              console.warn(`Photo generation failed for ${item.section}/${item.slot}:`, errData.error, errData.detail || '');
              return null;
            }
            const data = await res.json();
            return {
              id: `ai_${(item.section || 'photo').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${i}`,
              section: item.section,
              slot: item.slot,
              url: data.url,
              source: 'ai_generated',
              type: 'ai_generated',
            };
          })
        )
      );

      const generated = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      business._cachedGeneratedPhotos = generated;
      if (btn) {
        btn.disabled = false;
        btn.textContent = generated.length > 0 ? '\u2713' : t('btnPhotos');
      }

      if (generated.length > 0) {
        showToast(t('photosSuccess', business.name), 'success');
        // Save to database
        saveAiPhotosToDb(business, generated).catch(err =>
          console.warn('Failed to save AI photos:', err)
        );
        // Enable website button
        const row = btn ? btn.closest('tr') : null;
        const websiteBtn = row ? row.querySelector('.btn-website') : null;
        if (websiteBtn) websiteBtn.disabled = false;
      } else {
        business._cachedGeneratedPhotos = null; // Reset so user can retry
        showToast(t('photosError'), 'error');
      }
    } catch (err) {
      console.error('Photo generation error:', err);
      showToast(t('photosError'), 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = t('btnPhotos');
      }
    }
  }

  async function generateWebsiteFromTable(business, btn) {
    const hasReport = (business.generated_websites || []).some(w => w.config && w.config.researchReport) || business._cachedReport;
    if (!hasReport) {
      showToast(t('needsReport'), 'warning');
      return;
    }
    btn.disabled = true;
    btn.textContent = t('generatingWebsite');
    // Show elapsed time so user knows it's still working
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      btn.textContent = `${t('generatingWebsite')} ${elapsed}s`;
    }, 1000);
    try {
      const details = await loadDetailsForBusiness(business);
      const businessData = compileBusinessDataForPrompt(business, details);
      const photoInventory = buildPhotoInventory(details);
      // Append AI-generated photos to inventory
      if (business._cachedGeneratedPhotos) {
        photoInventory.push(...business._cachedGeneratedPhotos);
      }
      const language = business.address_country === 'MX' || business.address_country === 'CO' ? 'es' : 'en';
      const report = business._cachedReport ||
        ((business.generated_websites || []).find(w => w.config && w.config.researchReport) || {}).config?.researchReport;

      // Build photo manifest
      const photoManifest = buildPhotoManifest(report?.photoAssetPlan || [], photoInventory);

      // Write content (Sonnet)
      const contentResp = await withTimeout(
        fetch('/api/ai/write-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchReport: report, businessData, photoManifest, language }),
        }),
        120000, 'Content writing'
      );
      if (!contentResp.ok) {
        const errData = await contentResp.json().catch(() => ({}));
        throw new Error(errData.error || 'Content writing failed');
      }
      const websiteContent = await contentResp.json();

      // Generate HTML (Haiku) — with pre-written content
      const res = await withTimeout(
        fetch('/api/ai/generate-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteContent,
            designPalette: report?.designPalette,
            photoManifest: photoManifest.map(p => ({ section: p.section, slot: p.slot, url: p.url })),
            name: business.name,
            language,
          }),
        }),
        310000,
        'Website generation'
      );
      clearInterval(timerInterval);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }
      const data = await res.json();
      // Save to DB and wait for it to complete before showing ✓
      await saveGeneratedWebsite(business, data.html, report);
      btn.disabled = false;
      btn.textContent = '\u2713';
      btn.title = t('generateWebsite');
      showToast(t('websiteSuccess', business.name), 'success');
    } catch (err) {
      clearInterval(timerInterval);
      console.error('Website generation error:', err);
      showToast(t('websiteError'), 'error');
      btn.disabled = false;
      btn.textContent = t('btnWebsite');
    }
  }

  async function handleAdminTableWebsite(business, btn) {
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.html);
    if (existingWebsite) {
      // Show a small popup with Open and Regenerate options
      const popup = document.createElement('div');
      popup.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)';
      const publishedUrl = existingWebsite.published_url;
      const previewUrl = '/ver/' + existingWebsite.id;
      const url = publishedUrl || previewUrl;
      popup.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;max-width:340px;width:90%;text-align:center">
          <h3 style="margin:0 0 16px;color:var(--text);font-size:16px">${escapeHtml(business.name)}</h3>
          <div style="display:flex;flex-direction:column;gap:10px">
            <a href="${escapeHtml(url)}" target="_blank" class="btn btn-primary" style="text-decoration:none;text-align:center">${t('openWebsite')}</a>
            <button class="btn btn-secondary" id="website-popup-regenerate">${t('regenerateWebsite')}</button>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });
      popup.querySelector('#website-popup-regenerate').addEventListener('click', () => {
        popup.remove();
        // Clear existing website so generateWebsite runs fresh
        if (business.generated_websites) {
          business.generated_websites = business.generated_websites.filter(w => !(w.config && w.config.html));
        }
        btn.textContent = t('btnWebsite');
        generateWebsiteFromTable(business, btn);
      });
      return;
    }
    generateWebsiteFromTable(business, btn);
  }

  // ── Research Report (Modal) ──
  async function generateResearchReport(modal, business, details, btn) {
    // Check for cached report in existing website
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.researchReport);
    if (existingWebsite) {
      btn.style.display = 'none';
      renderResearchReport(modal, existingWebsite.config.researchReport);
      const websiteSection = modal.querySelector('#website-generation-section');
      if (websiteSection) websiteSection.style.display = '';
      return;
    }

    const container = modal.querySelector('#research-report-container');
    if (!container) return;

    btn.disabled = true;
    btn.textContent = t('generatingReport');
    container.innerHTML = `<div class="report-loading"><span class="spinner"></span><p>${t('reportGenerating')}</p></div>`;

    try {
      const businessData = compileBusinessDataForPrompt(business, details);
      const language = business.address_country === 'MX' || business.address_country === 'CO' ? 'es' : 'en';

      const res = await withTimeout(
        fetch('/api/ai/research-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessData, name: business.name, language }),
        }),
        310000,
        'Research report'
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let errMsg = 'Request failed';
        try { errMsg = JSON.parse(errText).error || errMsg; } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await parseSSEReportResponse(res);
      if (data.parseError) throw new Error('Failed to parse report response');

      // Check modal still exists
      if (!document.getElementById('detail-modal')) return;

      btn.style.display = 'none';
      renderResearchReport(modal, data);

      // Store report on the business's website config for caching
      business._cachedReport = data;

      // Persist report to database
      saveResearchReport(business, data).catch(err =>
        console.warn('Failed to save research report:', err)
      );

      // Show website generation section
      const websiteSection = modal.querySelector('#website-generation-section');
      if (websiteSection) websiteSection.style.display = '';
    } catch (err) {
      console.error('Research report error:', err);
      showToast(t('reportError'), 'error');
      btn.disabled = false;
      btn.textContent = t('generateReport');
      container.innerHTML = '';
    }
  }

  // ── Render Research Report ──
  function renderResearchReport(modal, report, containerSelector) {
    const container = modal.querySelector(containerSelector || '#research-report-container');
    if (!container) return;

    if (report.parseError && report.rawText) {
      container.innerHTML = `<div class="report-raw-text"><p>${escapeHtml(report.rawText)}</p></div>`;
      return;
    }

    let html = '';

    if (report.businessSummary) {
      html += `<div class="report-section"><h4>${t('reportBusinessSummary')}</h4><p>${escapeHtml(report.businessSummary)}</p></div>`;
    }

    if (report.keySellingPoints && report.keySellingPoints.length > 0) {
      const tags = report.keySellingPoints.map(p => `<span class="feature-tag">${escapeHtml(p)}</span>`).join('');
      html += `<div class="report-section"><h4>${t('reportSellingPoints')}</h4><div class="features-grid">${tags}</div></div>`;
    }

    if (report.reviewHighlights) {
      const rh = report.reviewHighlights;
      let rhHtml = '';
      if (rh.themes && rh.themes.length > 0) {
        const tags = rh.themes.map(th => `<span class="feature-tag">${escapeHtml(th)}</span>`).join('');
        rhHtml += `<div class="report-subsection"><h5>${t('reportReviewThemes')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (rh.quotableReviews && rh.quotableReviews.length > 0) {
        const quotes = rh.quotableReviews.map(q => `<blockquote class="report-blockquote">${escapeHtml(q)}</blockquote>`).join('');
        rhHtml += `<div class="report-subsection"><h5>${t('reportQuotableReviews')}</h5>${quotes}</div>`;
      }
      if (rh.areasToAvoid && rh.areasToAvoid.length > 0) {
        const tags = rh.areasToAvoid.map(a => `<span class="feature-tag report-warning-tag">${escapeHtml(a)}</span>`).join('');
        rhHtml += `<div class="report-subsection"><h5>${t('reportAreasToAvoid')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (rhHtml) {
        html += `<div class="report-section"><h4>${t('reportReviewHighlights')}</h4>${rhHtml}</div>`;
      }
    }

    if (report.suggestedSections && report.suggestedSections.length > 0) {
      const items = report.suggestedSections.map(s => {
        const priorityKey = 'reportPriority' + s.priority.charAt(0).toUpperCase() + s.priority.slice(1);
        const priorityClass = s.priority === 'high' ? 'badge-priority-high' : s.priority === 'medium' ? 'badge-priority-medium' : 'badge-priority-low';
        return `<div class="report-section-item">
          <div class="report-section-item-header"><strong>${escapeHtml(s.name)}</strong><span class="badge ${priorityClass}">${t(priorityKey)}</span></div>
          <p>${escapeHtml(s.description)}</p>
        </div>`;
      }).join('');
      html += `<div class="report-section"><h4>${t('reportSuggestedSections')}</h4>${items}</div>`;
    }

    if (report.toneRecommendations) {
      const tone = report.toneRecommendations;
      let toneHtml = '';
      if (tone.overallTone) toneHtml += `<p><strong>${t('reportOverallTone')}:</strong> ${escapeHtml(tone.overallTone)}</p>`;
      if (tone.writingStyle) toneHtml += `<p><strong>${t('reportWritingStyle')}:</strong> ${escapeHtml(tone.writingStyle)}</p>`;
      if (tone.wordsToUse && tone.wordsToUse.length > 0) {
        const tags = tone.wordsToUse.map(w => `<span class="feature-tag">${escapeHtml(w)}</span>`).join('');
        toneHtml += `<div class="report-subsection"><h5>${t('reportWordsToUse')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (tone.wordsToAvoid && tone.wordsToAvoid.length > 0) {
        const tags = tone.wordsToAvoid.map(w => `<span class="feature-tag report-warning-tag">${escapeHtml(w)}</span>`).join('');
        toneHtml += `<div class="report-subsection"><h5>${t('reportWordsToAvoid')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (toneHtml) html += `<div class="report-section"><h4>${t('reportToneRec')}</h4>${toneHtml}</div>`;
    }

    if (report.competitivePositioning) {
      html += `<div class="report-section"><h4>${t('reportCompetitive')}</h4><p>${escapeHtml(report.competitivePositioning)}</p></div>`;
    }

    if (report.contentGaps && report.contentGaps.length > 0) {
      const tags = report.contentGaps.map(g => `<span class="feature-tag report-warning-tag">${escapeHtml(g)}</span>`).join('');
      html += `<div class="report-section"><h4>${t('reportContentGaps')}</h4><div class="features-grid">${tags}</div></div>`;
    }

    if (report.socialMediaInsights) {
      html += `<div class="report-section"><h4>${t('reportSocialInsights')}</h4><p>${escapeHtml(report.socialMediaInsights)}</p></div>`;
    }

    if (report.localSeoKeywords && report.localSeoKeywords.length > 0) {
      const tags = report.localSeoKeywords.map(k => `<span class="feature-tag feature-tag-highlight">${escapeHtml(k)}</span>`).join('');
      html += `<div class="report-section"><h4>${t('reportSeoKeywords')}</h4><div class="features-grid">${tags}</div></div>`;
    }

    if (report.photoAssetPlan && report.photoAssetPlan.length > 0) {
      const items = report.photoAssetPlan.map(p => {
        const isExisting = p.recommendation === 'use_existing';
        const badgeClass = isExisting ? 'badge-has-site' : 'badge-no-site';
        const badgeText = isExisting ? t('reportPhotoExisting') : t('reportPhotoGenerate');
        let detailHtml = '';
        if (isExisting && p.existingPhotoId) {
          detailHtml = `<p class="photo-plan-detail"><strong>${t('reportPhotoSource')}:</strong> ${escapeHtml(p.existingPhotoId)}</p>`;
        } else if (p.aiPrompt) {
          detailHtml = `<p class="photo-plan-detail"><strong>${t('reportPhotoPrompt')}:</strong> ${escapeHtml(p.aiPrompt)}</p>`;
        }
        return `<div class="report-section-item">
          <div class="report-section-item-header"><strong>${escapeHtml(p.section)} — ${escapeHtml(p.slot)}</strong><span class="badge ${badgeClass}">${badgeText}</span></div>
          <p>${escapeHtml(p.rationale || '')}</p>
          ${detailHtml}
        </div>`;
      }).join('');
      html += `<div class="report-section"><h4>${t('reportPhotoAssetPlan')}</h4>${items}</div>`;
    }

    container.innerHTML = html;
  }

  // ── Website Generation ──
  async function generateWebsite(modal, business, details, btn) {
    // Check for cached website
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.html);
    if (existingWebsite) {
      btn.style.display = 'none';
      renderWebsitePreview(modal, existingWebsite.config.html, business);
      return;
    }

    const container = modal.querySelector('#website-generation-container');
    if (!container) return;

    btn.disabled = true;
    btn.textContent = t('generatingWebsite');
    container.innerHTML = `<div class="report-loading"><span class="spinner"></span><p>${t('websiteGenerating')}</p></div>`;

    try {
      const businessData = compileBusinessDataForPrompt(business, details);
      const photoInventory = buildPhotoInventory(details);
      const language = business.address_country === 'MX' || business.address_country === 'CO' ? 'es' : 'en';
      const report = business._cachedReport ||
        ((business.generated_websites || []).find(w => w.config && w.config.researchReport) || {}).config?.researchReport;

      // Build photo manifest
      const photoManifest = buildPhotoManifest(report?.photoAssetPlan || [], photoInventory);

      // Write content (Sonnet)
      const contentResp = await withTimeout(
        fetch('/api/ai/write-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchReport: report, businessData, photoManifest, language }),
        }),
        120000, 'Content writing'
      );
      if (!contentResp.ok) {
        const errData = await contentResp.json().catch(() => ({}));
        throw new Error(errData.error || 'Content writing failed');
      }
      const websiteContent = await contentResp.json();

      // Generate HTML (Haiku) — with pre-written content
      const res = await withTimeout(
        fetch('/api/ai/generate-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteContent,
            designPalette: report?.designPalette,
            photoManifest: photoManifest.map(p => ({ section: p.section, slot: p.slot, url: p.url })),
            name: business.name,
            language,
          }),
        }),
        310000,
        'Website generation'
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }

      const data = await res.json();

      if (!document.getElementById('detail-modal')) return;

      btn.style.display = 'none';
      renderWebsitePreview(modal, data.html, business);

      // Save to Supabase
      saveGeneratedWebsite(business, data.html, report).catch(err =>
        console.warn('Failed to save generated website:', err)
      );
    } catch (err) {
      console.error('Website generation error:', err);
      showToast(t('websiteError'), 'error');
      btn.disabled = false;
      btn.textContent = t('generateWebsite');
      container.innerHTML = '';
    }
  }

  // ── Website Preview ──
  function renderWebsitePreview(modal, html, business) {
    const container = modal.querySelector('#website-generation-container');
    if (!container) return;

    // Find the website record for this business
    const websiteRecord = (business.generated_websites || []).find(w => w.config && w.config.html);
    const websiteUuid = websiteRecord ? websiteRecord.id : null;
    const websiteStatus = websiteRecord ? websiteRecord.status : 'draft';
    const siteStatus = websiteRecord ? websiteRecord.site_status : null;
    const publishedUrl = websiteRecord ? websiteRecord.published_url : null;
    const isPublished = websiteStatus === 'published';
    const isSuspended = siteStatus === 'suspended';

    // Status badge
    let statusBadge = '';
    if (isPublished && isSuspended) {
      statusBadge = `<span class="badge" style="background:var(--warning-bg);color:var(--warning)">${t('websiteStatusSuspended')}</span>`;
    } else if (isPublished) {
      statusBadge = `<span class="badge badge-has-site">${t('websiteStatusPublished')}</span>`;
    } else {
      statusBadge = `<span class="badge badge-no-site">${t('websiteStatusDraft')}</span>`;
    }

    // Lifecycle buttons
    let lifecycleButtons = '';
    if (websiteUuid) {
      if (!isPublished) {
        lifecycleButtons += `<button class="btn btn-secondary" id="website-publish-btn" style="background:var(--success);color:#fff;border-color:var(--success)">${t('websitePublish')}</button>`;
      } else {
        if (isSuspended) {
          lifecycleButtons += `<button class="btn btn-secondary" id="website-reactivate-btn" style="background:var(--success);color:#fff;border-color:var(--success)">${t('websiteReactivate')}</button>`;
        } else {
          lifecycleButtons += `<button class="btn btn-secondary" id="website-suspend-btn" style="background:var(--warning-bg);color:var(--warning);border-color:var(--warning)">${t('websiteSuspend')}</button>`;
        }
        lifecycleButtons += `<button class="btn btn-secondary" id="website-unpublish-btn">${t('websiteUnpublish')}</button>`;
        if (publishedUrl) {
          lifecycleButtons += `<button class="btn btn-secondary" id="website-copy-live-url-btn">${t('websiteCopyLiveUrl')}</button>`;
        }
      }
    }

    container.innerHTML = `
      <div class="website-preview-wrapper">
        <div class="website-preview-toolbar">
          ${statusBadge}
          ${publishedUrl ? `<a href="${publishedUrl}" target="_blank" rel="noopener" style="font-size:12px;color:var(--primary);text-decoration:underline;margin-right:auto">${publishedUrl}</a>` : ''}
          <button class="btn btn-secondary" id="website-download-btn">${t('websiteDownload')}</button>
          <button class="btn btn-secondary" id="website-new-tab-btn">${t('websiteOpenNewTab')}</button>
          ${websiteUuid ? `<button class="btn btn-secondary" id="website-copy-link-btn">${t('websiteCopyLink')}</button>` : ''}
          ${websiteUuid && business.phone ? `<button class="btn btn-secondary" id="website-whatsapp-btn" style="background:var(--success);color:#fff;border-color:var(--success)">${t('websiteSendWhatsApp')}</button>` : ''}
          ${lifecycleButtons}
        </div>
        <iframe id="website-preview-iframe" class="website-preview-iframe" sandbox="allow-same-origin"></iframe>
      </div>
    `;

    const iframe = container.querySelector('#website-preview-iframe');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    container.querySelector('#website-download-btn').addEventListener('click', () => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${business.name.replace(/[^a-zA-Z0-9]/g, '_')}_website.html`;
      a.click();
      URL.revokeObjectURL(url);
    });

    container.querySelector('#website-new-tab-btn').addEventListener('click', () => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });

    // Copy preview link
    const copyLinkBtn = container.querySelector('#website-copy-link-btn');
    if (copyLinkBtn && websiteUuid) {
      copyLinkBtn.addEventListener('click', () => {
        const previewUrl = `${window.location.origin}/ver/${websiteUuid}`;
        copyToClipboard(previewUrl, t('websiteLinkCopied'));
      });
    }

    // Copy live URL
    const copyLiveUrlBtn = container.querySelector('#website-copy-live-url-btn');
    if (copyLiveUrlBtn && publishedUrl) {
      copyLiveUrlBtn.addEventListener('click', () => {
        copyToClipboard(publishedUrl, t('websiteLiveUrlCopied'));
      });
    }

    // Lifecycle actions
    bindLifecycleBtn(container, '#website-publish-btn', 'publish', websiteUuid, business, modal, html);
    bindLifecycleBtn(container, '#website-unpublish-btn', 'unpublish', websiteUuid, business, modal, html);
    bindLifecycleBtn(container, '#website-suspend-btn', 'suspend', websiteUuid, business, modal, html);
    bindLifecycleBtn(container, '#website-reactivate-btn', 'reactivate', websiteUuid, business, modal, html);

    // Send via WhatsApp
    const whatsappBtn = container.querySelector('#website-whatsapp-btn');
    if (whatsappBtn && websiteUuid && business.phone) {
      whatsappBtn.addEventListener('click', async () => {
        const previewUrl = `${window.location.origin}/ver/${websiteUuid}`;
        const message = `¡Hola! Tu página web ya está lista para revisar: ${previewUrl}`;
        try {
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: business.phone,
              message: message,
              businessId: business.id,
            }),
          });
          showToast(t('msgSendSuccess'), 'success');
        } catch (err) {
          console.error('WhatsApp send error:', err);
          showToast(t('msgSendError'), 'error');
        }
      });
    }
  }

  function copyToClipboard(text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg, 'success');
    });
  }

  function bindLifecycleBtn(container, selector, action, websiteId, business, modal, html) {
    const btn = container.querySelector(selector);
    if (!btn || !websiteId) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '...';
      try {
        const res = await fetch('/api/websites/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteId, action }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Unknown error');
        }

        // Update the in-memory website record
        const record = (business.generated_websites || []).find(w => w.id === websiteId);
        if (record) {
          record.status = data.website.status;
          record.site_status = data.website.site_status;
          record.published_url = data.website.published_url;
          record.version = data.website.version;
        }
        if (data.slug) {
          business.slug = data.slug;
        }

        const toastMap = {
          publish: 'websitePublished',
          unpublish: 'websiteUnpublished',
          suspend: 'websiteSuspended',
          reactivate: 'websiteReactivated',
        };
        showToast(t(toastMap[action]), 'success');

        // Re-render the preview toolbar with updated state
        renderWebsitePreview(modal, html, business);
      } catch (err) {
        console.error('Lifecycle action error:', err);
        showToast(t('websitePublishError'), 'error');
        btn.disabled = false;
        btn.textContent = t('websitePublish');
      }
    });
  }

  // ── Save Generated Website ──
  async function saveResearchReport(business, report) {
    if (!supabaseClient) return;

    try {
      // Check if a generated_websites row with a report already exists
      const existing = (business.generated_websites || []).find(w => w.config && w.config.researchReport);
      if (existing) return; // Already saved

      const { data, error } = await supabaseClient
        .from('generated_websites')
        .insert({
          business_id: business.id,
          template_name: 'ai_research_report',
          status: 'draft',
          config: {
            researchReport: report,
            generatedAt: new Date().toISOString(),
          },
        })
        .select('id, status, config');

      if (error) {
        console.warn('Report save error:', error);
      } else {
        // Update local business object so filters work immediately
        if (!business.generated_websites) business.generated_websites = [];
        if (data && data[0]) business.generated_websites.push(data[0]);
      }
    } catch (e) {
      console.warn('Report save exception:', e);
    }
  }

  async function saveGeneratedWebsite(business, html, report) {
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from('generated_websites')
        .insert({
          business_id: business.id,
          template_name: 'ai_generated_single_page',
          status: 'draft',
          config: {
            html: html,
            researchReport: report || null,
            generatedAt: new Date().toISOString(),
          },
        })
        .select('id, status, site_status, published_url, config');

      if (error) {
        console.warn('Website save error:', error);
      } else {
        showToast(t('websiteSaved'), 'success');
        // Update local business object so the ✓ button works immediately
        if (!business.generated_websites) business.generated_websites = [];
        if (data && data[0]) business.generated_websites.push(data[0]);
        // Refresh stats
        loadStats();
      }
    } catch (e) {
      console.warn('Website save exception:', e);
    }
  }

  // ── Save AI Photos to DB ──
  async function saveAiPhotosToDb(business, photos) {
    if (!supabaseClient || !photos || photos.length === 0) return;

    try {
      const rows = photos.map(p => ({
        business_id: business.id,
        source: 'ai_generated',
        photo_type: 'ai_generated',
        url: p.url,
        is_primary: false,
        caption: (p.section || '') + ' — ' + (p.slot || ''),
      }));

      const { error } = await supabaseClient
        .from('business_photos')
        .insert(rows);

      if (error) {
        console.warn('AI photos save error:', error);
      }
    } catch (e) {
      console.warn('AI photos save exception:', e);
    }
  }

  // ── WhatsApp Messaging ──

  // Messaging state
  let activeConversationId = null;
  let conversations = [];
  let currentMessages = [];
  let templates = [];
  let realtimeChannel = null;
  let activeTab = 'saved'; // 'saved' | 'audiences' | 'campaigns' | 'messages' | 'email' | 'products'

  // Email state
  let emailConversations = [];
  let currentEmailMessages = [];
  let activeEmailConversationId = null;
  let emailView = 'customers'; // 'customers' | 'inbox'

  // Audiences & Campaigns state
  let audiences = [];
  let campaigns = [];
  let editingAudienceId = null;
  let editingCampaignId = null;

  function switchTab(tab) {
    activeTab = tab;
    const sections = {
      saved: ['stats-bar', 'pipeline-pills', 'pipeline-search-row', 'filter-section', 'results-section'],
      audiences: ['audiences-section'],
      campaigns: ['campaigns-section'],
      messages: ['messaging-section'],
      email: ['email-section'],
      templates: ['templates-section'],
      products: ['products-section'],
      customers: ['customers-section'],
      edit_requests: ['edit-requests-section'],
      team: ['team-section'],
    };

    // Hide all sections
    ['stats-bar', 'pipeline-pills', 'pipeline-search-row', 'filter-section', 'results-section', 'audiences-section', 'campaigns-section', 'messaging-section', 'email-section', 'templates-section', 'products-section', 'customers-section', 'edit-requests-section', 'team-section'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Show sections for active tab
    (sections[tab] || []).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });

    // Show/hide search wrapper and section nav (only visible on Pipeline tab)
    const searchWrapper = document.getElementById('search-wrapper');
    const sectionNav = document.getElementById('section-nav');
    const pipelineAnchor = document.getElementById('pipeline-anchor');
    if (searchWrapper) searchWrapper.style.display = (tab === 'saved') ? '' : 'none';
    if (sectionNav) sectionNav.style.display = (tab === 'saved') ? '' : 'none';
    if (pipelineAnchor) pipelineAnchor.style.display = (tab === 'saved') ? '' : 'none';

    // Update nav active states (dropdown items)
    ['nav-saved', 'nav-audiences', 'nav-campaigns', 'nav-messages', 'nav-email', 'nav-templates', 'nav-products', 'nav-customers', 'nav-edit-requests', 'nav-team'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const tabToNav = { saved: 'nav-saved', audiences: 'nav-audiences', campaigns: 'nav-campaigns', messages: 'nav-messages', email: 'nav-email', templates: 'nav-templates', products: 'nav-products', customers: 'nav-customers', edit_requests: 'nav-edit-requests', team: 'nav-team' };
    const activeNav = document.getElementById(tabToNav[tab]);
    if (activeNav) activeNav.classList.add('active');

    // Update desktop group trigger active states
    document.querySelectorAll('.nav-group-trigger').forEach(tr => tr.classList.remove('active'));
    const group = TAB_TO_GROUP[tab];
    if (group) {
      const groupTrigger = document.getElementById('nav-group-' + group);
      if (groupTrigger) groupTrigger.classList.add('active');
    }

    // Update mobile nav
    updateMobileNav(tab);

    // Load data for the tab
    if (tab === 'audiences') loadAudiences();
    if (tab === 'campaigns') loadCampaigns();
    if (tab === 'messages') loadConversations();
    if (tab === 'email') loadEmailConversations();
    if (tab === 'templates') loadTemplates();
    if (tab === 'products') loadProducts();
    if (tab === 'customers') loadCustomers();
    if (tab === 'edit_requests') loadAdminEditRequests();
    if (tab === 'team') loadTeamEmployees();
  }

  // ── Business Saved Event (from search/app.js) ──
  document.addEventListener('business-saved', function () {
    if (activeTab === 'saved') {
      loadBusinesses();
      loadStats();
    }
  });

  // ── Sticky Section Nav ──
  function initSectionNav() {
    var searchBtn = document.getElementById('section-nav-search');
    var pipelineBtn = document.getElementById('section-nav-pipeline');
    if (!searchBtn || !pipelineBtn) return;

    searchBtn.addEventListener('click', function () {
      var target = document.getElementById('search-section');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });

    pipelineBtn.addEventListener('click', function () {
      var target = document.getElementById('pipeline-anchor');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });

    // IntersectionObserver to highlight which section is in view
    var anchor = document.getElementById('pipeline-anchor');
    if (anchor && window.IntersectionObserver) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var inPipeline = !entry.isIntersecting;
          // If pipeline anchor is below viewport, we're in search; if above, we're in pipeline
          if (entry.boundingClientRect.top < 0) {
            inPipeline = true;
          } else {
            inPipeline = false;
          }
          searchBtn.classList.toggle('active', !inPipeline);
          pipelineBtn.classList.toggle('active', inPipeline);
        });
      }, { threshold: 0 });
      observer.observe(anchor);
    }
  }

  function updateSectionNavCount(count) {
    var el = document.getElementById('section-nav-count');
    if (el) el.textContent = count > 0 ? '(' + count + ')' : '';
  }

  async function loadConversations() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_conversations')
        .select('*, businesses(name, phone)')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }
      conversations = data || [];
      renderConversationsList();
    } catch (err) {
      console.error('Load conversations error:', err);
    }
  }

  function renderConversationsList() {
    const container = document.getElementById('conversations-list');
    const searchTerm = (document.getElementById('conv-search')?.value || '').toLowerCase();

    const filtered = searchTerm
      ? conversations.filter(c => {
          const name = c.businesses?.name || '';
          return name.toLowerCase().includes(searchTerm);
        })
      : conversations;

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:13px">${t('msgNoConversations')}</div>`;
      return;
    }

    container.innerHTML = filtered.map(c => {
      const name = escapeHtml(c.businesses?.name || 'Unknown');
      const preview = escapeHtml(c.last_message_text || '');
      const time = c.last_message_at ? formatMessageTime(c.last_message_at) : '';
      const isActive = c.id === activeConversationId;
      const unread = c.unread_count > 0
        ? `<span class="unread-badge">${c.unread_count}</span>`
        : '';
      const initial = (c.businesses?.name || '?')[0].toUpperCase();

      return `<div class="conversation-item${isActive ? ' active' : ''}" data-conv-id="${c.id}">
        <div class="conversation-avatar">${initial}</div>
        <div class="conversation-info">
          <div class="conversation-name">${name}</div>
          <div class="conversation-preview">${preview}</div>
        </div>
        <div class="conversation-meta">
          <span class="conversation-time">${time}</span>
          ${unread}
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('.conversation-item').forEach(el => {
      el.addEventListener('click', () => {
        const convId = el.getAttribute('data-conv-id');
        openConversation(convId);
      });
    });
  }

  async function openConversation(convId) {
    activeConversationId = convId;
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    // Reset unread count
    if (conv.unread_count > 0) {
      conv.unread_count = 0;
      if (supabaseClient) {
        supabaseClient
          .from('whatsapp_conversations')
          .update({ unread_count: 0 })
          .eq('id', convId)
          .then(() => {});
      }
    }

    renderConversationsList();
    await loadMessages(convId);
    renderChatView(conv);
  }

  async function loadMessages(conversationId) {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      currentMessages = data || [];
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }

  function renderChatView(conv) {
    const chatPanel = document.getElementById('chat-panel');
    const name = escapeHtml(conv.businesses?.name || 'Unknown');
    const phone = escapeHtml(conv.recipient_phone || '');
    const windowOpen = check24HourWindow(conv);
    const windowBadge = windowOpen
      ? `<span class="chat-window-badge chat-window-open">${t('msgWindowOpen')}</span>`
      : `<span class="chat-window-badge chat-window-closed">${t('msgWindowClosed')}</span>`;

    let inputHtml;
    if (windowOpen) {
      inputHtml = `<div class="chat-input-area">
        <textarea id="chat-input" rows="1" placeholder="${t('msgPlaceholder')}"></textarea>
        <button class="btn-send" id="btn-send-msg">${t('msgSend')}</button>
      </div>`;
    } else {
      inputHtml = `<div class="template-selector" id="template-selector">
        <div class="template-selector-label">${t('msgTemplateRequired')}</div>
        <div class="template-selector-row">
          <select class="input" id="template-select">
            <option value="">${t('msgTemplateSelect')}</option>
            ${templates.filter(tpl => tpl.meta_status === 'APPROVED').map(tpl =>
              `<option value="${escapeHtml(tpl.template_name)}" data-params="${tpl.param_count}">${escapeHtml(tpl.template_name)} (${escapeHtml(tpl.language)})</option>`
            ).join('')}
          </select>
          <button class="btn-send" id="btn-send-template">${t('msgSendTemplate')}</button>
        </div>
        <div class="template-params" id="template-params"></div>
      </div>`;
    }

    chatPanel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <h3>${name}</h3>
          <div class="chat-header-phone">${phone}</div>
        </div>
        ${windowBadge}
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      ${inputHtml}
    `;

    renderMessages();
    bindChatEvents(conv);

    // Scroll to bottom
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    let lastDate = '';
    container.innerHTML = currentMessages.map(msg => {
      const msgDate = new Date(msg.created_at).toLocaleDateString();
      let dateDivider = '';
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        dateDivider = `<div class="msg-date-divider">${formatDateLabel(msg.created_at)}</div>`;
      }

      const isOutbound = msg.direction === 'outbound';
      const bubbleClass = isOutbound ? 'msg-outbound' : 'msg-inbound';
      const failedClass = msg.status === 'failed' ? ' msg-failed' : '';
      const templateClass = msg.message_type === 'template' ? ' msg-template' : '';
      const time = formatMessageTime(msg.created_at, true);
      const statusTick = isOutbound ? renderStatusTick(msg.status) : '';
      const body = msg.body
        ? escapeHtml(msg.body)
        : msg.template_name
          ? `[${escapeHtml(msg.template_name)}]`
          : '';

      return `${dateDivider}<div class="msg-bubble ${bubbleClass}${failedClass}${templateClass}" data-msg-id="${msg.id}">
        <div>${body}</div>
        <div class="msg-time">${time}${statusTick}</div>
      </div>`;
    }).join('');
  }

  function renderStatusTick(status) {
    switch (status) {
      case 'sent': return ' <span class="msg-status" title="' + t('msgStatusSent') + '">&#10003;</span>';
      case 'delivered': return ' <span class="msg-status" title="' + t('msgStatusDelivered') + '">&#10003;&#10003;</span>';
      case 'read': return ' <span class="msg-status" title="' + t('msgStatusRead') + '" style="color:#53bdeb">&#10003;&#10003;</span>';
      case 'failed': return ' <span class="msg-status" title="' + t('msgStatusFailed') + '" style="color:var(--danger)">&#10007;</span>';
      default: return ' <span class="msg-status">&#9711;</span>';
    }
  }

  function bindChatEvents(conv) {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-msg');
    const templateSelect = document.getElementById('template-select');
    const sendTemplateBtn = document.getElementById('btn-send-template');
    const templateParamsContainer = document.getElementById('template-params');

    if (chatInput && sendBtn) {
      // Auto-resize textarea
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
      });

      // Send on Enter (Shift+Enter for newline)
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(conv);
        }
      });

      sendBtn.addEventListener('click', () => sendMessage(conv));
    }

    if (templateSelect) {
      templateSelect.addEventListener('change', () => {
        if (!templateParamsContainer) return;
        const paramCount = parseInt(templateSelect.selectedOptions[0]?.getAttribute('data-params') || '0', 10);
        templateParamsContainer.innerHTML = '';
        for (let i = 0; i < paramCount; i++) {
          templateParamsContainer.innerHTML += `<input type="text" class="input" placeholder="${t('msgTemplateParam', i + 1)}" data-param-index="${i}">`;
        }
      });
    }

    if (sendTemplateBtn) {
      sendTemplateBtn.addEventListener('click', () => sendTemplateMessage(conv));
    }
  }

  async function sendMessage(conv) {
    const chatInput = document.getElementById('chat-input');
    const text = chatInput?.value?.trim();
    if (!text) return;

    const sendBtn = document.getElementById('btn-send-msg');
    sendBtn.disabled = true;
    sendBtn.textContent = t('msgSending');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Optimistic UI
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: conv.id,
      business_id: conv.business_id,
      direction: 'outbound',
      message_type: 'text',
      body: text,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    currentMessages.push(optimisticMsg);
    renderMessages();
    scrollChatToBottom();

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: conv.business_id,
            phone: conv.recipient_phone,
            message: text,
          }),
        }),
        15000,
        'WhatsApp send'
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Send failed');
      }

      // Update optimistic message
      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].id = data.messageId;
        currentMessages[idx].wamid = data.wamid;
        currentMessages[idx].status = 'sent';
      }
      renderMessages();

      // Update conversation preview
      conv.last_message_text = text.substring(0, 200);
      conv.last_message_at = new Date().toISOString();
      renderConversationsList();
    } catch (err) {
      console.error('Send message error:', err);
      showToast(t('msgSendError'), 'error');
      // Mark optimistic message as failed
      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].status = 'failed';
      }
      renderMessages();
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = t('msgSend');
    }
  }

  async function sendTemplateMessage(conv) {
    const templateSelect = document.getElementById('template-select');
    const templateName = templateSelect?.value;
    if (!templateName) return;

    const paramInputs = document.querySelectorAll('#template-params input');
    const templateParams = Array.from(paramInputs).map(inp => inp.value);

    const sendBtn = document.getElementById('btn-send-template');
    sendBtn.disabled = true;
    sendBtn.textContent = t('msgSending');

    // Find template for language
    const tpl = templates.find(t => t.template_name === templateName);

    // Optimistic UI
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: conv.id,
      business_id: conv.business_id,
      direction: 'outbound',
      message_type: 'template',
      template_name: templateName,
      body: null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    currentMessages.push(optimisticMsg);
    renderMessages();
    scrollChatToBottom();

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: conv.business_id,
            phone: conv.recipient_phone,
            templateName: templateName,
            templateParams: templateParams.length > 0 ? templateParams : undefined,
            language: tpl?.language || 'en',
          }),
        }),
        15000,
        'WhatsApp send template'
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Send failed');
      }

      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].id = data.messageId;
        currentMessages[idx].wamid = data.wamid;
        currentMessages[idx].status = 'sent';
      }
      renderMessages();
      showToast(t('msgSendSuccess'), 'success');

      conv.last_message_text = `[Template: ${templateName}]`;
      conv.last_message_at = new Date().toISOString();
      renderConversationsList();
    } catch (err) {
      console.error('Send template error:', err);
      showToast(t('msgSendError'), 'error');
      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].status = 'failed';
      }
      renderMessages();
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = t('msgSendTemplate');
    }
  }

  function check24HourWindow(conv) {
    if (!conv.last_inbound_at) return false;
    const lastInbound = new Date(conv.last_inbound_at);
    const hoursSince = (Date.now() - lastInbound.getTime()) / (1000 * 60 * 60);
    return hoursSince <= 24;
  }

  async function startNewConversation(businessId, phone) {
    if (!phone) {
      showToast(t('msgNoPhone'), 'warning');
      return;
    }

    // Switch to messages tab
    switchTab('messages');

    // Check if conversation already exists
    const existing = conversations.find(c => c.business_id == businessId);
    if (existing) {
      openConversation(existing.id);
      return;
    }

    // Upsert new conversation
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_conversations')
        .upsert({
          business_id: businessId,
          recipient_phone: phone,
          status: 'active',
        }, { onConflict: 'business_id' })
        .select('*, businesses(name, phone)');

      if (error) {
        console.error('Create conversation error:', error);
        return;
      }
      if (data && data.length > 0) {
        // Refresh and open
        await loadConversations();
        openConversation(data[0].id);
      }
    } catch (err) {
      console.error('Start conversation error:', err);
    }
  }

  async function loadTemplates() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_templates')
        .select('*')
        .eq('meta_status', 'APPROVED');

      if (error) {
        console.warn('Error loading templates:', error);
        return;
      }
      templates = data || [];
    } catch (err) {
      console.warn('Load templates error:', err);
    }
  }

  async function syncTemplates() {
    showToast(t('msgSyncTemplates'), 'warning');
    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/templates'),
        15000,
        'Template sync'
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      templates = data.templates || [];
      showToast(t('msgSyncSuccess'), 'success');
    } catch (err) {
      console.error('Sync templates error:', err);
      showToast(t('msgSyncError'), 'error');
    }
  }

  function setupRealtimeSubscription() {
    if (!supabaseClient) return;

    realtimeChannel = supabaseClient
      .channel('whatsapp-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          const msg = payload.new;
          // Inbound message
          if (msg.direction === 'inbound') {
            handleNewInboundMessage(msg);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          handleMessageStatusUpdate(payload.new);
        }
      )
      .subscribe();
  }

  function handleNewInboundMessage(msg) {
    // If viewing this conversation, append message
    if (msg.conversation_id === activeConversationId) {
      currentMessages.push(msg);
      renderMessages();
      scrollChatToBottom();

      // Reset unread since we're viewing
      if (supabaseClient) {
        supabaseClient
          .from('whatsapp_conversations')
          .update({ unread_count: 0 })
          .eq('id', msg.conversation_id)
          .then(() => {});
      }
    }

    // Update conversations list
    const conv = conversations.find(c => c.id === msg.conversation_id);
    if (conv) {
      conv.last_message_text = (msg.body || '').substring(0, 200);
      conv.last_message_at = msg.created_at;
      conv.last_inbound_at = msg.created_at;
      if (msg.conversation_id !== activeConversationId) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      }
      // Re-sort conversations
      conversations.sort((a, b) => {
        const aTime = a.last_message_at || a.created_at;
        const bTime = b.last_message_at || b.created_at;
        return new Date(bTime) - new Date(aTime);
      });
      renderConversationsList();
    } else {
      // New conversation — reload the list
      loadConversations();
    }
  }

  function handleMessageStatusUpdate(msg) {
    if (msg.conversation_id !== activeConversationId) return;
    const idx = currentMessages.findIndex(m => m.id === msg.id || m.wamid === msg.wamid);
    if (idx >= 0) {
      currentMessages[idx].status = msg.status;
      currentMessages[idx].delivered_at = msg.delivered_at;
      currentMessages[idx].read_at = msg.read_at;
      renderMessages();
    }
  }

  function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function formatMessageTime(ts, timeOnly) {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (timeOnly) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('msgYesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  function formatDateLabel(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('msgToday');
    if (diffDays === 1) return t('msgYesterday');
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  // ── Audiences ──

  async function loadAudiences() {
    try {
      const res = await withTimeout(fetch('/api/whatsapp/audiences'), 10000, 'Load audiences');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      audiences = data || [];
      renderAudiencesList();
    } catch (err) {
      console.error('Load audiences error:', err);
    }
  }

  function renderAudiencesList() {
    const container = document.getElementById('audiences-list');
    const noAudiences = document.getElementById('no-audiences');

    if (audiences.length === 0) {
      container.innerHTML = '';
      noAudiences.style.display = '';
      return;
    }
    noAudiences.style.display = 'none';

    container.innerHTML = audiences.map(a => {
      const desc = a.description ? escapeHtml(a.description) : '';
      const filterCount = Object.keys(a.filters || {}).filter(k => a.filters[k] !== null && a.filters[k] !== '').length;
      return `<div class="audience-card" data-id="${a.id}">
        <div class="audience-info">
          <div class="audience-name">${escapeHtml(a.name)}</div>
          <div class="audience-meta">${desc}${desc ? ' · ' : ''}${filterCount} filter${filterCount !== 1 ? 's' : ''}</div>
        </div>
        <span class="audience-count">${a.business_count || 0} businesses</span>
        <div class="audience-actions">
          <button class="btn btn-view btn-sm" data-edit-audience="${a.id}">${t('audienceEdit')}</button>
          <button class="btn btn-secondary btn-sm" data-delete-audience="${a.id}" style="color:var(--danger);border-color:var(--danger)">&#10005;</button>
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('[data-edit-audience]').forEach(btn => {
      btn.addEventListener('click', () => openAudienceEditor(btn.getAttribute('data-edit-audience')));
    });
    container.querySelectorAll('[data-delete-audience]').forEach(btn => {
      btn.addEventListener('click', () => deleteAudience(btn.getAttribute('data-delete-audience')));
    });
  }

  function openAudienceEditor(audienceId) {
    const editor = document.getElementById('audience-editor');
    const listCard = document.getElementById('audiences-list-card');
    const title = document.getElementById('audience-editor-title');

    editor.style.display = '';
    listCard.style.display = 'none';
    editingAudienceId = audienceId || null;

    // Reset form
    document.getElementById('audience-name').value = '';
    document.getElementById('audience-desc').value = '';
    document.getElementById('aud-filter-city').value = '';
    document.getElementById('aud-filter-state').value = '';
    document.getElementById('aud-filter-country').value = '';
    document.getElementById('aud-filter-category').value = '';
    document.getElementById('aud-filter-rating-min').value = '';
    document.getElementById('aud-filter-rating-max').value = '';
    document.getElementById('aud-filter-msg-min').value = '';
    document.getElementById('aud-filter-msg-max').value = '';
    document.getElementById('aud-filter-replies-min').value = '';
    document.getElementById('aud-filter-replies-max').value = '';
    document.getElementById('aud-filter-never-contacted').value = '';
    document.getElementById('aud-filter-last-after').value = '';
    document.getElementById('audience-preview-count').textContent = '';
    document.getElementById('audience-preview-results').innerHTML = '';

    if (audienceId) {
      title.textContent = t('audienceEdit');
      const audience = audiences.find(a => a.id === audienceId);
      if (audience) {
        document.getElementById('audience-name').value = audience.name || '';
        document.getElementById('audience-desc').value = audience.description || '';
        const f = audience.filters || {};
        if (f.address_city) document.getElementById('aud-filter-city').value = f.address_city;
        if (f.address_state) document.getElementById('aud-filter-state').value = f.address_state;
        if (f.address_country) document.getElementById('aud-filter-country').value = f.address_country;
        if (f.category) document.getElementById('aud-filter-category').value = f.category;
        if (f.rating_min) document.getElementById('aud-filter-rating-min').value = f.rating_min;
        if (f.rating_max) document.getElementById('aud-filter-rating-max').value = f.rating_max;
        if (f.messages_sent_min) document.getElementById('aud-filter-msg-min').value = f.messages_sent_min;
        if (f.messages_sent_max) document.getElementById('aud-filter-msg-max').value = f.messages_sent_max;
        if (f.replies_min) document.getElementById('aud-filter-replies-min').value = f.replies_min;
        if (f.replies_max) document.getElementById('aud-filter-replies-max').value = f.replies_max;
        if (f.never_contacted) document.getElementById('aud-filter-never-contacted').value = 'true';
        if (f.last_contacted_after) document.getElementById('aud-filter-last-after').value = f.last_contacted_after.split('T')[0];
      }
    } else {
      title.textContent = t('audienceNew');
    }
  }

  function closeAudienceEditor() {
    document.getElementById('audience-editor').style.display = 'none';
    document.getElementById('audiences-list-card').style.display = '';
    editingAudienceId = null;
  }

  function getAudienceFilters() {
    const filters = {};
    const city = document.getElementById('aud-filter-city').value.trim();
    const state = document.getElementById('aud-filter-state').value.trim();
    const country = document.getElementById('aud-filter-country').value;
    const category = document.getElementById('aud-filter-category').value.trim();
    const ratingMin = document.getElementById('aud-filter-rating-min').value;
    const ratingMax = document.getElementById('aud-filter-rating-max').value;
    const msgMin = document.getElementById('aud-filter-msg-min').value;
    const msgMax = document.getElementById('aud-filter-msg-max').value;
    const repliesMin = document.getElementById('aud-filter-replies-min').value;
    const repliesMax = document.getElementById('aud-filter-replies-max').value;
    const neverContacted = document.getElementById('aud-filter-never-contacted').value;
    const lastAfter = document.getElementById('aud-filter-last-after').value;

    if (city) filters.address_city = city;
    if (state) filters.address_state = state;
    if (country) filters.address_country = country;
    if (category) filters.category = category;
    if (ratingMin) filters.rating_min = ratingMin;
    if (ratingMax) filters.rating_max = ratingMax;
    if (msgMin) filters.messages_sent_min = msgMin;
    if (msgMax) filters.messages_sent_max = msgMax;
    if (repliesMin) filters.replies_min = repliesMin;
    if (repliesMax) filters.replies_max = repliesMax;
    if (neverContacted === 'true') filters.never_contacted = true;
    if (lastAfter) filters.last_contacted_after = lastAfter + 'T00:00:00Z';

    return filters;
  }

  async function previewAudience() {
    const filters = getAudienceFilters();
    const countEl = document.getElementById('audience-preview-count');
    const resultsEl = document.getElementById('audience-preview-results');

    countEl.textContent = '...';
    resultsEl.innerHTML = '';

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/audience-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters, limit: 20, offset: 0 }),
        }),
        15000,
        'Audience preview'
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');

      countEl.textContent = t('audiencePreviewCount', data.total_count || 0);

      if (data.businesses && data.businesses.length > 0) {
        resultsEl.innerHTML = `<table class="audience-preview-table">
          <thead><tr>
            <th>${t('thName')}</th>
            <th>${t('thPhone')}</th>
            <th>${t('filterCity')}</th>
            <th>${t('audienceFilterCategory')}</th>
            <th>${t('thRating')}</th>
            <th>Msgs</th>
            <th>Replies</th>
          </tr></thead>
          <tbody>${data.businesses.map(b => `<tr>
            <td>${escapeHtml(b.name || '')}</td>
            <td>${escapeHtml(b.phone || '')}</td>
            <td>${escapeHtml(b.address_city || '')}</td>
            <td>${escapeHtml(b.category || '')}</td>
            <td>${b.rating || '—'}</td>
            <td>${b.messages_sent || 0}</td>
            <td>${b.replies_received || 0}</td>
          </tr>`).join('')}</tbody>
        </table>`;
      }
    } catch (err) {
      console.error('Preview error:', err);
      countEl.textContent = 'Error';
    }
  }

  async function saveAudience() {
    const name = document.getElementById('audience-name').value.trim();
    if (!name) {
      showToast(t('audienceName') + ' required', 'warning');
      return;
    }

    const description = document.getElementById('audience-desc').value.trim();
    const filters = getAudienceFilters();

    const payload = { name, description: description || null, filters };
    if (editingAudienceId) payload.id = editingAudienceId;

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/audiences', {
          method: editingAudienceId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        10000,
        'Save audience'
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      showToast(t('audienceSaved'), 'success');
      closeAudienceEditor();
      loadAudiences();
    } catch (err) {
      console.error('Save audience error:', err);
      showToast(err.message, 'error');
    }
  }

  async function deleteAudience(id) {
    if (!confirm(t('audienceDeleteConfirm'))) return;

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/audiences?id=' + id, { method: 'DELETE' }),
        10000,
        'Delete audience'
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      showToast(t('audienceDeleted'), 'success');
      loadAudiences();
    } catch (err) {
      console.error('Delete audience error:', err);
      showToast(err.message, 'error');
    }
  }


  // ── Campaigns ──

  async function loadCampaigns() {
    try {
      const res = await withTimeout(fetch('/api/whatsapp/campaigns'), 10000, 'Load campaigns');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      campaigns = data || [];
      renderCampaignsList();
    } catch (err) {
      console.error('Load campaigns error:', err);
    }
  }

  function renderCampaignsList() {
    const container = document.getElementById('campaigns-list');
    const noCampaigns = document.getElementById('no-campaigns');
    const listCard = document.getElementById('campaigns-list-card');
    const editor = document.getElementById('campaign-editor');
    const detail = document.getElementById('campaign-detail');

    // Show list, hide editor and detail
    listCard.style.display = '';
    editor.style.display = 'none';
    detail.style.display = 'none';

    if (campaigns.length === 0) {
      container.innerHTML = '';
      noCampaigns.style.display = '';
      return;
    }
    noCampaigns.style.display = 'none';

    container.innerHTML = campaigns.map(c => {
      const audienceName = c.whatsapp_audiences?.name || '—';
      const templateName = c.whatsapp_templates?.template_name || '—';
      const statusClass = 'campaign-status-' + (c.status || 'draft');
      const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString() : '';

      return `<div class="campaign-card" data-campaign-id="${c.id}">
        <div class="campaign-info">
          <div class="campaign-name">${escapeHtml(c.name)}</div>
          <div class="campaign-meta">${escapeHtml(audienceName)} · ${escapeHtml(templateName)} · ${dateStr}</div>
          ${c.status === 'sent' || c.status === 'sending' ? `<div class="campaign-mini-stats">
            <span class="campaign-mini-stat"><span>${c.sent_count || 0}</span> sent</span>
            <span class="campaign-mini-stat"><span>${c.delivered_count || 0}</span> delivered</span>
            <span class="campaign-mini-stat"><span>${c.read_count || 0}</span> read</span>
            <span class="campaign-mini-stat"><span>${c.replied_count || 0}</span> replied</span>
          </div>` : ''}
        </div>
        <span class="campaign-status ${statusClass}">${c.status || 'draft'}</span>
      </div>`;
    }).join('');

    container.querySelectorAll('.campaign-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-campaign-id');
        openCampaignDetail(id);
      });
    });
  }

  async function openCampaignEditor(campaignId) {
    const editor = document.getElementById('campaign-editor');
    const listCard = document.getElementById('campaigns-list-card');
    const detail = document.getElementById('campaign-detail');
    const title = document.getElementById('campaign-editor-title');

    editor.style.display = '';
    listCard.style.display = 'none';
    detail.style.display = 'none';
    editingCampaignId = campaignId || null;

    // Populate audience select
    if (audiences.length === 0) await loadAudiences();
    const audSelect = document.getElementById('campaign-audience');
    audSelect.innerHTML = `<option value="">${t('campaignSelectAudience')}</option>` +
      audiences.map(a => `<option value="${a.id}">${escapeHtml(a.name)} (${a.business_count})</option>`).join('');

    // Populate template select
    if (templates.length === 0) await loadTemplates();
    const tplSelect = document.getElementById('campaign-template');
    tplSelect.innerHTML = `<option value="">${t('campaignSelectTemplate')}</option>` +
      templates.filter(t => t.meta_status === 'APPROVED').map(tpl =>
        `<option value="${tpl.id}" data-body="${escapeHtml(tpl.body_text || '')}" data-params="${tpl.param_count || 0}" data-lang="${escapeHtml(tpl.language || 'en')}">${escapeHtml(tpl.template_name)} (${escapeHtml(tpl.language || 'en')})</option>`
      ).join('');

    // Reset form
    document.getElementById('campaign-name').value = '';
    document.getElementById('campaign-schedule').value = '';
    document.getElementById('campaign-template-preview').style.display = 'none';
    document.getElementById('campaign-template-params').innerHTML = '';

    if (campaignId) {
      title.textContent = t('campaignEdit');
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        document.getElementById('campaign-name').value = campaign.name || '';
        audSelect.value = campaign.audience_id || '';
        tplSelect.value = campaign.template_id || '';
        if (campaign.scheduled_at) {
          document.getElementById('campaign-schedule').value = campaign.scheduled_at.slice(0, 16);
        }
        onCampaignTemplateChange();
        // Fill params
        const params = campaign.template_params || [];
        setTimeout(() => {
          params.forEach((p, i) => {
            const input = document.querySelector(`#campaign-template-params input[data-param-index="${i}"]`);
            if (input) input.value = p;
          });
        }, 50);
      }
    } else {
      title.textContent = t('campaignNew');
    }
  }

  function closeCampaignEditor() {
    document.getElementById('campaign-editor').style.display = 'none';
    document.getElementById('campaigns-list-card').style.display = '';
    editingCampaignId = null;
  }

  function onCampaignTemplateChange() {
    const select = document.getElementById('campaign-template');
    const preview = document.getElementById('campaign-template-preview');
    const paramsContainer = document.getElementById('campaign-template-params');
    const opt = select.selectedOptions[0];

    if (!opt || !opt.value) {
      preview.style.display = 'none';
      paramsContainer.innerHTML = '';
      return;
    }

    const body = opt.getAttribute('data-body') || '';
    const paramCount = parseInt(opt.getAttribute('data-params') || '0', 10);

    if (body) {
      preview.textContent = body;
      preview.style.display = '';
    } else {
      preview.style.display = 'none';
    }

    paramsContainer.innerHTML = '';
    for (let i = 0; i < paramCount; i++) {
      paramsContainer.innerHTML += `<input type="text" class="input" placeholder="Parameter {{${i + 1}}}" data-param-index="${i}">`;
    }
  }

  async function saveCampaign(sendNow) {
    const name = document.getElementById('campaign-name').value.trim();
    const audienceId = document.getElementById('campaign-audience').value;
    const templateId = document.getElementById('campaign-template').value;
    const scheduleVal = document.getElementById('campaign-schedule').value;

    if (!name || !audienceId || !templateId) {
      showToast('Name, audience, and template are required', 'warning');
      return;
    }

    const paramInputs = document.querySelectorAll('#campaign-template-params input');
    const templateParams = Array.from(paramInputs).map(inp => inp.value);

    const payload = {
      name,
      audience_id: audienceId,
      template_id: templateId,
      template_params: templateParams.length > 0 ? templateParams : [],
    };

    if (editingCampaignId) payload.id = editingCampaignId;
    if (scheduleVal && !sendNow) payload.scheduled_at = new Date(scheduleVal).toISOString();

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/campaigns', {
          method: editingCampaignId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        10000,
        'Save campaign'
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      showToast(t('campaignSaved'), 'success');

      if (sendNow) {
        const campaign = data;
        const audience = audiences.find(a => a.id === audienceId);
        const count = audience?.business_count || 0;

        if (!confirm(t('campaignSendConfirm', count))) {
          closeCampaignEditor();
          loadCampaigns();
          return;
        }

        await executeCampaignSend(campaign.id);
      }

      closeCampaignEditor();
      loadCampaigns();
    } catch (err) {
      console.error('Save campaign error:', err);
      showToast(err.message, 'error');
    }
  }

  async function executeCampaignSend(campaignId) {
    showToast(t('campaignSendStarted'), 'warning');

    let sending = true;
    while (sending) {
      try {
        const res = await withTimeout(
          fetch('/api/whatsapp/campaign-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: campaignId }),
          }),
          120000, // 2min timeout per batch
          'Campaign send batch'
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Send failed');

        if (data.status === 'sent') {
          sending = false;
          showToast(t('campaignSendComplete'), 'success');
        } else {
          // Still sending — show progress
          showToast(`Sent ${data.processed || 0} / ${data.total_recipients || 0}...`, 'warning');
        }
      } catch (err) {
        console.error('Campaign send error:', err);
        showToast(t('campaignSendError'), 'error');
        sending = false;
      }
    }

    loadCampaigns();
  }

  async function openCampaignDetail(campaignId) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const listCard = document.getElementById('campaigns-list-card');
    const editor = document.getElementById('campaign-editor');
    const detail = document.getElementById('campaign-detail');

    listCard.style.display = 'none';
    editor.style.display = 'none';
    detail.style.display = '';

    document.getElementById('campaign-detail-title').textContent = escapeHtml(campaign.name);

    // Stats bar
    const statsBar = document.getElementById('campaign-stats-bar');
    statsBar.innerHTML = [
      { label: t('campaignStatTotal'), value: campaign.total_recipients || 0, cls: '' },
      { label: t('campaignStatSent'), value: campaign.sent_count || 0, cls: 'stat-sent' },
      { label: t('campaignStatDelivered'), value: campaign.delivered_count || 0, cls: 'stat-delivered' },
      { label: t('campaignStatRead'), value: campaign.read_count || 0, cls: 'stat-read' },
      { label: t('campaignStatReplied'), value: campaign.replied_count || 0, cls: 'stat-replied' },
      { label: t('campaignStatFailed'), value: campaign.failed_count || 0, cls: 'stat-failed' },
    ].map(s => `<div class="campaign-stat">
      <span class="campaign-stat-value ${s.cls}">${s.value}</span>
      <span class="campaign-stat-label">${s.label}</span>
    </div>`).join('');

    // Load campaign messages
    const msgContainer = document.getElementById('campaign-detail-messages');
    msgContainer.innerHTML = '<div style="padding:16px;color:var(--text-dim);font-size:13px">Loading messages...</div>';

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('whatsapp_campaign_messages')
          .select('*, businesses(name, phone), whatsapp_messages(status, delivered_at, read_at)')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          msgContainer.innerHTML = '<div style="padding:16px;color:var(--danger);font-size:13px">Error loading messages</div>';
          return;
        }

        if (!data || data.length === 0) {
          msgContainer.innerHTML = '<div style="padding:16px;color:var(--text-dim);font-size:13px">No messages sent yet</div>';
          return;
        }

        msgContainer.innerHTML = data.map(cm => {
          const name = escapeHtml(cm.businesses?.name || 'Unknown');
          const phone = escapeHtml(cm.businesses?.phone || '');
          const msgStatus = cm.whatsapp_messages?.status || 'pending';
          const statusIcon = renderStatusTick(msgStatus);

          return `<div class="campaign-msg-row">
            <div>
              <span class="campaign-msg-name">${name}</span>
              <span class="campaign-msg-phone">${phone}</span>
            </div>
            <div>${msgStatus}${statusIcon}</div>
          </div>`;
        }).join('');
      } catch (err) {
        console.error('Load campaign messages error:', err);
        msgContainer.innerHTML = '<div style="padding:16px;color:var(--danger);font-size:13px">Error loading messages</div>';
      }
    }
  }

  function closeCampaignDetail() {
    document.getElementById('campaign-detail').style.display = 'none';
    document.getElementById('campaigns-list-card').style.display = '';
  }


  // ── Products ──

  let products = [];
  let editingProductId = null;

  async function loadProducts() {
    try {
      const res = await fetch('/api/products/list');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      products = data.products || [];
      renderProductsList();
    } catch (err) {
      console.error('Load products error:', err);
    }
  }

  function renderProductsList() {
    const container = document.getElementById('products-list');
    const noProducts = document.getElementById('no-products');

    if (!products.length) {
      container.innerHTML = '';
      noProducts.style.display = '';
      return;
    }

    noProducts.style.display = 'none';
    const currencySymbols = { MXN: '$', USD: '$', COP: '$' };

    container.innerHTML = products.map(p => {
      const symbol = currencySymbols[p.currency] || '$';
      const priceStr = symbol + parseFloat(p.price).toLocaleString('en', { minimumFractionDigits: 0 });
      const intervalLabels = { monthly: t('productPerMonth', priceStr), yearly: t('productPerYear', priceStr), one_time: priceStr };
      const priceLabel = intervalLabels[p.billing_interval] || priceStr;
      const features = p.features || [];

      return `<div class="product-card ${!p.is_active ? 'product-inactive' : ''}">
        <div class="product-card-header">
          <div>
            <div class="product-card-name">${escapeHtml(p.name)}</div>
            <div class="product-card-price">${priceLabel} <span class="product-card-currency">${p.currency}</span></div>
          </div>
          <div class="product-card-actions">
            <button class="btn btn-view" onclick="document.dispatchEvent(new CustomEvent('edit-product',{detail:'${p.id}'}))">${t('productEdit')}</button>
            <button class="btn btn-secondary btn-sm" onclick="document.dispatchEvent(new CustomEvent('delete-product',{detail:'${p.id}'}))" style="color:var(--danger)">✕</button>
          </div>
        </div>
        ${p.description ? `<div class="product-card-desc">${escapeHtml(p.description)}</div>` : ''}
        ${features.length ? `<ul class="product-card-features">${features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
        <div class="product-card-meta">
          ${p.stripe_price_id ? `<span class="badge badge-has-site">Stripe ✓</span>` : `<span class="badge badge-no-site">No Stripe</span>`}
          ${!p.is_active ? `<span class="badge badge-no-site">Inactive</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  function openProductEditor(productId) {
    editingProductId = productId || null;
    const editor = document.getElementById('product-editor');
    const listCard = document.getElementById('products-list-card');
    const title = document.getElementById('product-editor-title');

    listCard.style.display = 'none';
    editor.style.display = '';

    if (productId) {
      title.textContent = t('productEdit');
      const p = products.find(x => x.id === productId);
      if (p) {
        document.getElementById('product-name').value = p.name || '';
        document.getElementById('product-price').value = p.price || '';
        document.getElementById('product-currency').value = p.currency || 'MXN';
        document.getElementById('product-interval').value = p.billing_interval || 'monthly';
        document.getElementById('product-description').value = p.description || '';
        document.getElementById('product-features').value = (p.features || []).join('\n');
        document.getElementById('product-stripe-product-id').value = p.stripe_product_id || '';
        document.getElementById('product-stripe-price-id').value = p.stripe_price_id || '';
        document.getElementById('product-sort-order').value = p.sort_order || 0;
        document.getElementById('product-active').value = p.is_active !== false ? 'true' : 'false';
      }
    } else {
      title.textContent = t('productNew');
      document.getElementById('product-name').value = '';
      document.getElementById('product-price').value = '';
      document.getElementById('product-currency').value = 'MXN';
      document.getElementById('product-interval').value = 'monthly';
      document.getElementById('product-description').value = '';
      document.getElementById('product-features').value = '';
      document.getElementById('product-stripe-product-id').value = '';
      document.getElementById('product-stripe-price-id').value = '';
      document.getElementById('product-sort-order').value = '0';
      document.getElementById('product-active').value = 'true';
    }
  }

  function closeProductEditor() {
    document.getElementById('product-editor').style.display = 'none';
    document.getElementById('products-list-card').style.display = '';
    editingProductId = null;
  }

  async function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    const price = document.getElementById('product-price').value;
    if (!name || !price) {
      showToast('Name and price are required', 'error');
      return;
    }

    const featuresText = document.getElementById('product-features').value.trim();
    const features = featuresText ? featuresText.split('\n').map(f => f.trim()).filter(Boolean) : [];

    const payload = {
      name,
      price: parseFloat(price),
      currency: document.getElementById('product-currency').value,
      billing_interval: document.getElementById('product-interval').value,
      description: document.getElementById('product-description').value.trim() || null,
      features,
      stripe_product_id: document.getElementById('product-stripe-product-id').value.trim() || null,
      stripe_price_id: document.getElementById('product-stripe-price-id').value.trim() || null,
      sort_order: parseInt(document.getElementById('product-sort-order').value) || 0,
      is_active: document.getElementById('product-active').value === 'true',
    };

    if (editingProductId) {
      payload.id = editingProductId;
    }

    try {
      const res = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Product save error:', res.status, errData);
        throw new Error(errData.detail || errData.error || 'Save failed');
      }
      showToast(t('productSaved'), 'success');
      closeProductEditor();
      loadProducts();
    } catch (err) {
      console.error('Product save error:', err);
      showToast('Failed to save product: ' + err.message, 'error');
    }
  }

  async function deleteProduct(productId) {
    if (!confirm(t('productDeleteConfirm'))) return;
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      showToast(t('productDeleted'), 'success');
      loadProducts();
    } catch (err) {
      console.error('Product delete error:', err);
    }
  }

  // Product event listeners (using custom events for inline onclick)
  document.addEventListener('edit-product', (e) => openProductEditor(e.detail));
  document.addEventListener('delete-product', (e) => deleteProduct(e.detail));

  // Product button listeners
  const btnCreateProduct = document.getElementById('btn-create-product');
  if (btnCreateProduct) btnCreateProduct.addEventListener('click', () => openProductEditor(null));

  const btnCancelProduct = document.getElementById('btn-cancel-product');
  if (btnCancelProduct) btnCancelProduct.addEventListener('click', closeProductEditor);

  const btnSaveProduct = document.getElementById('btn-save-product');
  if (btnSaveProduct) btnSaveProduct.addEventListener('click', saveProduct);


  // ── Customers ──

  let customersData = [];
  let customersFiltered = [];

  async function loadCustomers() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('customers')
        .select('*, businesses(name, phone, whatsapp, email, category, subcategory, address_full, rating, review_count, pipeline_status, generated_websites(id, status, site_status, published_url, config)), subscriptions(id, status, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, cancel_at_period_end, created_at)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      customersData = data || [];
      applyCustomerFilters();
    } catch (err) {
      console.error('Load customers error:', err);
    }
  }

  function applyCustomerFilters() {
    const search = (document.getElementById('customers-search')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('customers-status-filter')?.value || '';

    customersFiltered = customersData.filter(c => {
      // Status filter
      if (statusFilter) {
        const sub = (c.subscriptions || [])[0];
        const subStatus = sub ? sub.status : 'incomplete';
        if (subStatus !== statusFilter) return false;
      }
      // Search filter
      if (search) {
        const biz = c.businesses || {};
        const haystack = [
          biz.name, c.contact_name, c.email, biz.phone, biz.whatsapp
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    renderCustomersStats();
    renderCustomersList();
  }

  function renderCustomersStats() {
    const container = document.getElementById('customers-stats');
    if (!container) return;

    const total = customersFiltered.length;
    const active = customersFiltered.filter(c => {
      const sub = (c.subscriptions || [])[0];
      return sub && sub.status === 'active';
    }).length;

    // Calculate MRR from active subscriptions
    let mrr = 0;
    customersFiltered.forEach(c => {
      const sub = (c.subscriptions || [])[0];
      if (sub && sub.status === 'active' && c.monthly_price) {
        mrr += parseFloat(c.monthly_price);
      }
    });
    const mrrStr = '$' + mrr.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    container.innerHTML = `
      <div class="customers-stat">${t('custTotalCustomers', total)}</div>
      <div class="customers-stat customers-stat-active">${t('custActiveCount', active)}</div>
      <div class="customers-stat customers-stat-mrr">${t('custMrr', mrrStr)}</div>
    `;
  }

  function renderCustomersList() {
    const tbody = document.getElementById('customers-table-body');
    const noCustomers = document.getElementById('no-customers');
    if (!tbody) return;

    if (!customersFiltered.length) {
      tbody.innerHTML = '';
      if (noCustomers) noCustomers.style.display = '';
      return;
    }

    if (noCustomers) noCustomers.style.display = 'none';

    tbody.innerHTML = customersFiltered.map((c, idx) => {
      const biz = c.businesses || {};
      const sub = (c.subscriptions || [])[0];
      const subStatus = sub ? sub.status : 'incomplete';

      const statusLabels = { active: 'Active', past_due: 'Past Due', cancelled: 'Cancelled', incomplete: 'Incomplete', trialing: 'Trial' };
      const statusBadge = subStatus === 'active'
        ? 'badge-has-site'
        : subStatus === 'cancelled' ? 'badge-no-site'
        : 'badge-no-site';
      const statusLabel = statusLabels[subStatus] || subStatus;

      const priceStr = c.monthly_price
        ? '$' + parseFloat(c.monthly_price).toLocaleString('en', { minimumFractionDigits: 0 }) + ' ' + (c.currency || '')
        : '—';

      const sinceDate = c.created_at ? new Date(c.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

      // Website URLs from generated_websites via business
      const websites = (biz.generated_websites || []);
      // Pick the website with actual content (config.html exists), fallback to first
      const websiteRecord = websites.find(w => w.config && w.config.html) || websites[0] || null;
      const demoUrl = websiteRecord ? '/ver/' + websiteRecord.id : null;
      const publishedUrl = websiteRecord ? websiteRecord.published_url : null;
      const hasDomain = !!(publishedUrl);

      const demoUrlHtml = demoUrl
        ? `<a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener" style="color:var(--primary);font-size:12px">Preview</a>`
        : '<span style="color:var(--text-dim)">—</span>';
      const publishedUrlHtml = publishedUrl
        ? `<a href="${escapeHtml(publishedUrl)}" target="_blank" rel="noopener" style="color:var(--primary);font-size:12px">Live</a>`
        : '<span style="color:var(--text-dim)">—</span>';
      const domainHtml = hasDomain
        ? '<span style="color:var(--success);font-size:16px">&#10003;</span>'
        : '<span style="color:var(--text-dim)">No</span>';

      return `<tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(biz.name || '—')}</strong></td>
        <td>${escapeHtml(c.contact_name || '—')}</td>
        <td>${escapeHtml(c.email || '—')}</td>
        <td>${escapeHtml(biz.phone || '—')}</td>
        <td>${priceStr}</td>
        <td class="td-center">${demoUrlHtml}</td>
        <td class="td-center">${publishedUrlHtml}</td>
        <td class="td-center">${domainHtml}</td>
        <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
        <td>${sinceDate}</td>
        <td><button class="btn btn-view" onclick="document.dispatchEvent(new CustomEvent('view-customer',{detail:'${c.id}'}))">${t('custView')}</button></td>
      </tr>`;
    }).join('');
  }

  async function openCustomerDetail(customerId) {
    const customer = customersData.find(c => c.id === customerId);
    if (!customer) return;

    const listCard = document.getElementById('customers-list-card');
    const detail = document.getElementById('customer-detail');
    const title = document.getElementById('customer-detail-title');
    const content = document.getElementById('customer-detail-content');

    listCard.style.display = 'none';
    detail.style.display = '';

    const biz = customer.businesses || {};
    const sub = (customer.subscriptions || [])[0];
    title.textContent = biz.name || customer.contact_name || 'Customer';

    const statusLabels = { active: 'Active', past_due: 'Past Due', cancelled: 'Cancelled', incomplete: 'Incomplete', trialing: 'Trial' };
    const subStatus = sub ? sub.status : null;
    const statusBadge = subStatus === 'active' ? 'badge-has-site' : 'badge-no-site';

    const whatsappNum = biz.whatsapp || biz.phone || '';
    const whatsappLink = whatsappNum ? `https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}` : '';
    const portalLink = biz.name ? `/mipagina/${encodeURIComponent(biz.name.toLowerCase().replace(/\s+/g, '-'))}` : '';

    // Fetch website data for this customer's business
    let website = null;
    if (supabaseClient && customer.business_id) {
      try {
        const { data: websites } = await supabaseClient
          .from('generated_websites')
          .select('id, status, site_status, published_url, custom_domain, domain_status, domain_verified_at, version')
          .eq('business_id', customer.business_id)
          .order('created_at', { ascending: false })
          .limit(1);
        website = (websites || [])[0] || null;
      } catch (err) {
        console.error('Fetch website error:', err);
      }
    }

    // Website status
    let siteStatusLabel = '', siteStatusBadge = '';
    if (website) {
      if (website.site_status === 'suspended') {
        siteStatusLabel = t('custStatusSuspended');
        siteStatusBadge = 'badge-no-site';
      } else if (website.status === 'published') {
        siteStatusLabel = t('custStatusPublished');
        siteStatusBadge = 'badge-has-site';
      } else {
        siteStatusLabel = t('custStatusDraft');
        siteStatusBadge = 'badge-no-site';
      }
    }

    // Domain section HTML
    let domainHtml = '';
    if (website) {
      if (!website.custom_domain) {
        domainHtml = `
          <p style="color:var(--text-muted);font-size:13px;margin-bottom:10px">${t('custDomainNone')}</p>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" class="input" id="cust-domain-input" placeholder="${t('custDomainPlaceholder')}" style="flex:1;max-width:300px">
            <button class="btn btn-primary" id="btn-cust-add-domain">${t('custDomainAdd')}</button>
          </div>`;
      } else if (website.domain_status === 'pending_verification') {
        domainHtml = `
          <div style="margin-bottom:10px">
            <span class="badge badge-no-site" style="background:var(--warning-bg);color:var(--warning)">${t('custDomainPending')}</span>
            <strong style="margin-left:8px">${escapeHtml(website.custom_domain)}</strong>
          </div>
          <div style="background:var(--bg-input);padding:12px;border-radius:var(--radius);margin-bottom:10px">
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${t('custDnsInstructions')}</p>
            <div style="display:flex;gap:16px;font-size:13px">
              <div><span style="color:var(--text-dim)">${t('custDnsCname')}</span> <strong>${escapeHtml(website.custom_domain)}</strong></div>
              <div><span style="color:var(--text-dim)">→</span> <strong>${t('custDnsValue')}</strong></div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" id="btn-cust-verify-domain">${t('custDomainVerify')}</button>
            <button class="btn btn-secondary" id="btn-cust-remove-domain">${t('custDomainRemove')}</button>
          </div>`;
      } else if (website.domain_status === 'verified') {
        domainHtml = `
          <div style="margin-bottom:10px">
            <span class="badge badge-has-site">${t('custDomainVerified')}</span>
            <strong style="margin-left:8px">${escapeHtml(website.custom_domain)}</strong>
          </div>
          <button class="btn btn-secondary" id="btn-cust-remove-domain">${t('custDomainRemove')}</button>`;
      } else if (website.domain_status === 'failed') {
        domainHtml = `
          <div style="margin-bottom:10px">
            <span class="badge badge-no-site">${t('custDomainFailed')}</span>
            <strong style="margin-left:8px">${escapeHtml(website.custom_domain)}</strong>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" id="btn-cust-verify-domain">${t('custDomainVerify')}</button>
            <button class="btn btn-secondary" id="btn-cust-remove-domain">${t('custDomainRemove')}</button>
          </div>`;
      } else {
        domainHtml = `<p style="color:var(--text-muted);font-size:13px">${t('custDomainNone')}</p>`;
      }
    }

    content.innerHTML = `
      <div class="customer-detail-grid">
        <div class="customer-detail-section">
          <h3>${t('custDetailBusiness')}</h3>
          <div class="customer-detail-rows">
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custColBusiness')}</span>
              <span>${escapeHtml(biz.name || '—')}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custCategory')}</span>
              <span>${escapeHtml(biz.category || biz.subcategory || '—')}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custAddress')}</span>
              <span>${escapeHtml(biz.address_full || '—')}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custRating')}</span>
              <span>${biz.rating ? biz.rating + ' ★ (' + (biz.review_count || 0) + ')' : '—'}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custPipeline')}</span>
              <span><span class="badge badge-has-site">${escapeHtml(biz.pipeline_status || 'customer')}</span></span>
            </div>
          </div>
        </div>

        <div class="customer-detail-section">
          <h3>${t('custDetailContact')}</h3>
          <div class="customer-detail-rows">
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custColContact')}</span>
              <span>${escapeHtml(customer.contact_name || '—')}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custColEmail')}</span>
              <span><a href="mailto:${escapeHtml(customer.email)}" style="color:var(--primary)">${escapeHtml(customer.email || '—')}</a></span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custColPhone')}</span>
              <span>${escapeHtml(biz.phone || '—')}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custWhatsApp')}</span>
              <span>${whatsappLink ? `<a href="${whatsappLink}" target="_blank" style="color:var(--success)">${escapeHtml(whatsappNum)}</a>` : '—'}</span>
            </div>
            ${portalLink ? `<div class="customer-detail-row">
              <span class="customer-detail-label">${t('custPortalLink')}</span>
              <span><a href="${portalLink}" target="_blank" style="color:var(--primary)">${portalLink}</a></span>
            </div>` : ''}
          </div>
        </div>

        <div class="customer-detail-section">
          <h3>${t('custDetailSubscription')}</h3>
          ${sub ? `<div class="customer-detail-rows">
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custColStatus')}</span>
              <span><span class="badge ${statusBadge}">${statusLabels[subStatus] || subStatus}</span>${sub.cancel_at_period_end ? ' <span class="badge badge-no-site">Cancels at period end</span>' : ''}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custColPlan')}</span>
              <span>${customer.monthly_price ? '$' + parseFloat(customer.monthly_price).toLocaleString('en', { minimumFractionDigits: 0 }) + ' ' + (customer.currency || '') + '/mo' : '—'}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custBillingPeriod')}</span>
              <span>${sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString('en', { month: 'short', day: 'numeric' }) + ' — ' + new Date(sub.current_period_end).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custStripeId')}</span>
              <span style="font-size:12px;color:var(--text-muted)">${escapeHtml(customer.stripe_customer_id || '—')}</span>
            </div>
          </div>` : `<p style="color:var(--text-muted);font-size:13px">${t('custNoSubscription')}</p>`}
        </div>

        <div class="customer-detail-section">
          <h3>${t('custDetailNotes')}</h3>
          <textarea class="input" id="customer-notes" rows="4" style="width:100%;resize:vertical">${escapeHtml(customer.notes || '')}</textarea>
          <button class="btn btn-primary" id="btn-save-customer-notes" style="margin-top:10px" data-customer-id="${customer.id}">${t('custNotesSave')}</button>
        </div>

        <div class="customer-detail-section">
          <h3>${t('custWebsiteSection')}</h3>
          ${website ? `<div class="customer-detail-rows">
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custWebsiteStatus')}</span>
              <span><span class="badge ${siteStatusBadge}">${siteStatusLabel}</span></span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custPublishedUrl')}</span>
              <span>${website.published_url ? `<a href="${escapeHtml(website.published_url)}" target="_blank" style="color:var(--primary)">${escapeHtml(website.published_url)}</a>` : '—'}</span>
            </div>
            <div class="customer-detail-row">
              <span class="customer-detail-label">${t('custWebsiteVersion')}</span>
              <span>${website.version || 1}</span>
            </div>
          </div>` : `<p style="color:var(--text-muted);font-size:13px">${t('custNoWebsite')}</p>`}
        </div>

        ${website ? `<div class="customer-detail-section">
          <h3>${t('custDomainSection')}</h3>
          ${domainHtml}
        </div>` : ''}
      </div>
    `;

    // Wire up save notes button
    const btnSaveNotes = document.getElementById('btn-save-customer-notes');
    if (btnSaveNotes) {
      btnSaveNotes.addEventListener('click', async () => {
        const notes = document.getElementById('customer-notes')?.value || '';
        const cid = btnSaveNotes.getAttribute('data-customer-id');
        try {
          const { error } = await supabaseClient
            .from('customers')
            .update({ notes: notes.trim() || null })
            .eq('id', cid);
          if (error) throw error;
          showToast(t('custNotesSaved'), 'success');
          const c = customersData.find(x => x.id === cid);
          if (c) c.notes = notes.trim() || null;
        } catch (err) {
          console.error('Save notes error:', err);
          showToast('Failed to save notes', 'error');
        }
      });
    }

    // Wire up domain action buttons
    if (website) bindCustomerDomainActions(website.id, customerId);
  }

  function bindCustomerDomainActions(websiteId, customerId) {
    const btnAdd = document.getElementById('btn-cust-add-domain');
    const btnVerify = document.getElementById('btn-cust-verify-domain');
    const btnRemove = document.getElementById('btn-cust-remove-domain');

    if (btnAdd) {
      btnAdd.addEventListener('click', async () => {
        const domain = document.getElementById('cust-domain-input')?.value.trim();
        if (!domain) return;
        btnAdd.disabled = true;
        btnAdd.textContent = t('custDomainAdding');
        try {
          const res = await fetch('/api/domains/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteId, domain })
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Failed');
          showToast(t('custDomainAdded'), 'success');
          openCustomerDetail(customerId);
        } catch (err) {
          console.error('Add domain error:', err);
          showToast(t('custDomainError'), 'error');
          btnAdd.disabled = false;
          btnAdd.textContent = t('custDomainAdd');
        }
      });
    }

    if (btnVerify) {
      btnVerify.addEventListener('click', async () => {
        btnVerify.disabled = true;
        btnVerify.textContent = t('custDomainVerifying');
        try {
          const res = await fetch(`/api/domains/verify?websiteId=${websiteId}`);
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Failed');
          showToast(result.status === 'verified' ? t('custDomainVerified') : t('custDomainPending'), result.status === 'verified' ? 'success' : 'warning');
          openCustomerDetail(customerId);
        } catch (err) {
          console.error('Verify domain error:', err);
          showToast(t('custDomainError'), 'error');
          btnVerify.disabled = false;
          btnVerify.textContent = t('custDomainVerify');
        }
      });
    }

    if (btnRemove) {
      btnRemove.addEventListener('click', async () => {
        btnRemove.disabled = true;
        btnRemove.textContent = t('custDomainRemoving');
        try {
          const res = await fetch('/api/domains/remove', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteId })
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Failed');
          showToast(t('custDomainRemoved'), 'success');
          openCustomerDetail(customerId);
        } catch (err) {
          console.error('Remove domain error:', err);
          showToast(t('custDomainError'), 'error');
          btnRemove.disabled = false;
          btnRemove.textContent = t('custDomainRemove');
        }
      });
    }
  }

  function closeCustomerDetail() {
    document.getElementById('customer-detail').style.display = 'none';
    document.getElementById('customers-list-card').style.display = '';
  }

  // Customer event listeners
  document.addEventListener('view-customer', (e) => openCustomerDetail(e.detail));

  const btnBackCustomers = document.getElementById('btn-back-customers');
  if (btnBackCustomers) btnBackCustomers.addEventListener('click', closeCustomerDetail);

  const custSearch = document.getElementById('customers-search');
  if (custSearch) custSearch.addEventListener('input', applyCustomerFilters);

  const custStatusFilter = document.getElementById('customers-status-filter');
  if (custStatusFilter) custStatusFilter.addEventListener('change', applyCustomerFilters);

  // ── Edit Requests ──

  let adminEditRequestsData = [];
  let adminEditRequestsFiltered = [];

  async function loadAdminEditRequests() {
    const statusFilter = document.getElementById('er-status-filter');
    const priorityFilter = document.getElementById('er-priority-filter');

    let url = '/api/edit-requests/list?limit=200';
    if (statusFilter && statusFilter.value) url += '&status=' + encodeURIComponent(statusFilter.value);
    if (priorityFilter && priorityFilter.value) url += '&priority=' + encodeURIComponent(priorityFilter.value);

    try {
      const res = await fetch(url);
      const data = await res.json();
      adminEditRequestsData = data.editRequests || [];
      applyAdminEditRequestFilters();
    } catch (err) {
      console.error('Load edit requests error:', err);
      adminEditRequestsData = [];
      applyAdminEditRequestFilters();
    }
  }

  function applyAdminEditRequestFilters() {
    const searchEl = document.getElementById('er-search');
    const search = (searchEl ? searchEl.value : '').toLowerCase().trim();

    adminEditRequestsFiltered = adminEditRequestsData.filter(r => {
      if (search) {
        const haystack = [
          r.business_name || '',
          r.customer_name || '',
          r.customer_email || '',
          r.description || '',
          r.request_type || '',
        ].join(' ').toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }
      return true;
    });

    renderAdminEditRequestsStats();
    renderAdminEditRequestsList();
  }

  function renderAdminEditRequestsStats() {
    const container = document.getElementById('er-stats');
    if (!container) return;
    const total = adminEditRequestsFiltered.length;
    const open = adminEditRequestsFiltered.filter(r => r.status !== 'completed' && r.status !== 'rejected' && r.status !== 'customer_rejected').length;
    container.innerHTML = '<span>' + t('erStatsTotal', total) + '</span><span>' + t('erStatsOpen', open) + '</span>';
  }

  function getErStatusBadge(status) {
    const map = {
      submitted: 'badge-no-site',
      processing: 'badge-no-site',
      in_review: 'badge-no-site',
      in_progress: 'badge-no-site',
      ready_for_review: 'badge-no-site',
      completed: 'badge-has-site',
      rejected: 'badge-no-site',
      customer_rejected: 'badge-no-site',
    };
    return map[status] || 'badge-no-site';
  }

  function getErStatusLabel(status) {
    const map = {
      submitted: t('erStatusSubmitted'),
      processing: t('erStatusProcessing'),
      in_review: t('erStatusInReview'),
      in_progress: t('erStatusInProgress'),
      ready_for_review: t('erStatusReadyForReview'),
      completed: t('erStatusCompleted'),
      rejected: t('erStatusRejected'),
      customer_rejected: t('erStatusCustomerRejected'),
    };
    return map[status] || status;
  }

  function getErPriorityLabel(priority) {
    const map = {
      low: t('erPriorityLow'),
      normal: t('erPriorityNormal'),
      high: t('erPriorityHigh'),
      urgent: t('erPriorityUrgent'),
    };
    return map[priority] || priority;
  }

  function getErTypeLabel(type) {
    const map = {
      content_update: t('erTypeContent'),
      photo_update: t('erTypePhoto'),
      contact_update: t('erTypeContact'),
      hours_update: t('erTypeHours'),
      menu_update: t('erTypeMenu'),
      design_change: t('erTypeDesign'),
      other: t('erTypeOther'),
    };
    return map[type] || type;
  }

  function renderAdminEditRequestsList() {
    const tbody = document.getElementById('er-table-body');
    if (!tbody) return;

    if (!adminEditRequestsFiltered.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#8b8fa3;">' + t('erEmpty') + '</td></tr>';
      return;
    }

    tbody.innerHTML = adminEditRequestsFiltered.map((r, idx) => {
      const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString() : '—';
      const desc = escapeHtml((r.description || '').substring(0, 80)) + (r.description && r.description.length > 80 ? '…' : '');
      const priorityClass = r.priority === 'urgent' || r.priority === 'high' ? 'badge-no-site' : '';
      const statusBadge = getErStatusBadge(r.status);
      const hasAi = r.ai_conversation ? ' 🤖' : '';

      return '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + dateStr + '</td>' +
        '<td><strong>' + escapeHtml(r.business_name || '—') + '</strong></td>' +
        '<td>' + getErTypeLabel(r.request_type) + hasAi + '</td>' +
        '<td>' + desc + '</td>' +
        '<td><span class="badge ' + priorityClass + '">' + getErPriorityLabel(r.priority) + '</span></td>' +
        '<td><span class="badge ' + statusBadge + '">' + getErStatusLabel(r.status) + '</span></td>' +
        '<td><button class="btn btn-view" onclick="document.dispatchEvent(new CustomEvent(\'view-edit-request\',{detail:\'' + r.id + '\'}))">' + t('erView') + '</button></td>' +
        '</tr>';
    }).join('');
  }

  async function openEditRequestDetail(requestId) {
    const request = adminEditRequestsData.find(r => r.id === requestId);
    if (!request) return;

    const listCard = document.getElementById('er-list-card');
    const detail = document.getElementById('er-detail');
    if (listCard) listCard.style.display = 'none';
    if (detail) detail.style.display = '';

    const title = document.getElementById('er-detail-title');
    if (title) title.textContent = getErTypeLabel(request.request_type) + ' — ' + (request.business_name || '');

    const content = document.getElementById('er-detail-content');
    if (!content) return;

    const dateStr = request.created_at ? new Date(request.created_at).toLocaleDateString() : '—';

    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">';

    // Left column: Request info
    html += '<div>';
    html += '<h3 style="margin-bottom:12px;font-size:15px;font-weight:700;">' + t('erDetailTitle') + '</h3>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">';
    html += '<div><span style="color:#8b8fa3;">' + t('erColDate') + ':</span> ' + dateStr + '</div>';
    html += '<div><span style="color:#8b8fa3;">' + t('erColBusiness') + ':</span> ' + escapeHtml(request.business_name || '—') + '</div>';
    html += '<div><span style="color:#8b8fa3;">' + t('erCustomer') + ':</span> ' + escapeHtml(request.customer_name || request.customer_email || '—') + '</div>';
    html += '<div><span style="color:#8b8fa3;">' + t('erColType') + ':</span> ' + getErTypeLabel(request.request_type) + '</div>';
    html += '<div><span style="color:#8b8fa3;">' + t('erColPriority') + ':</span> <span class="badge ' + (request.priority === 'urgent' || request.priority === 'high' ? 'badge-no-site' : '') + '">' + getErPriorityLabel(request.priority) + '</span></div>';
    html += '<div><span style="color:#8b8fa3;">' + t('erColStatus') + ':</span> <span class="badge ' + getErStatusBadge(request.status) + '">' + getErStatusLabel(request.status) + '</span></div>';
    html += '</div>';

    // Description
    html += '<div style="margin-top:16px;">';
    html += '<h3 style="margin-bottom:8px;font-size:15px;font-weight:700;">' + t('erColDescription') + '</h3>';
    html += '<div style="background:#252833;padding:14px;border-radius:8px;font-size:13px;line-height:1.6;white-space:pre-wrap;">' + escapeHtml(request.description || '—') + '</div>';
    html += '</div>';

    // AI Edit Summary (if present)
    if (request.ai_edit_summary) {
      html += '<div style="margin-top:16px;">';
      html += '<h3 style="margin-bottom:8px;font-size:15px;font-weight:700;">🤖 AI Edit Summary</h3>';
      html += '<div style="background:#1a2433;padding:14px;border-radius:8px;font-size:13px;line-height:1.6;border-left:3px solid #6366f1;">' + escapeHtml(request.ai_edit_summary) + '</div>';
      html += '</div>';
    }

    // Element info (if from visual editor)
    if (request.element_type || request.element_selector) {
      html += '<div style="margin-top:16px;">';
      html += '<h3 style="margin-bottom:8px;font-size:15px;font-weight:700;">' + t('erElementInfo') + '</h3>';
      html += '<div style="background:#252833;padding:14px;border-radius:8px;font-size:13px;">';
      if (request.element_type) html += '<div><span style="color:#8b8fa3;">Type:</span> ' + escapeHtml(request.element_type) + '</div>';
      if (request.element_selector) html += '<div style="margin-top:4px;"><span style="color:#8b8fa3;">Selector:</span> <code style="font-size:11px;background:#1a1d27;padding:2px 6px;border-radius:4px;">' + escapeHtml(request.element_selector) + '</code></div>';
      if (request.current_value) html += '<div style="margin-top:4px;"><span style="color:#8b8fa3;">Current:</span> ' + escapeHtml((request.current_value || '').substring(0, 200)) + '</div>';
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';

    // Right column: Status management + notes
    html += '<div>';

    // Status update
    html += '<h3 style="margin-bottom:12px;font-size:15px;font-weight:700;">' + t('erUpdateStatus') + '</h3>';
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">';
    html += '<select id="er-detail-status" class="input input-sort">';
    ['submitted', 'processing', 'in_review', 'in_progress', 'ready_for_review', 'completed', 'rejected', 'customer_rejected'].forEach(s => {
      html += '<option value="' + s + '"' + (s === request.status ? ' selected' : '') + '>' + getErStatusLabel(s) + '</option>';
    });
    html += '</select>';
    html += '<button class="btn btn-primary" id="btn-er-update-status">' + t('erUpdateStatus') + '</button>';
    html += '</div>';

    // Rejection reason (shown/hidden based on status)
    html += '<div id="er-rejection-wrap" style="margin-bottom:16px;' + (request.status === 'rejected' || request.status === 'customer_rejected' ? '' : 'display:none;') + '">';
    html += '<label style="font-size:13px;font-weight:600;color:#8b8fa3;margin-bottom:6px;display:block;">' + t('erRejectionReason') + '</label>';
    html += '<textarea id="er-rejection-reason" class="input" rows="3" style="width:100%;resize:vertical;">' + escapeHtml(request.rejection_reason || '') + '</textarea>';
    html += '</div>';

    // Admin notes
    html += '<h3 style="margin-bottom:8px;font-size:15px;font-weight:700;">' + t('erAdminNotes') + '</h3>';
    html += '<textarea id="er-admin-notes" class="input" rows="4" style="width:100%;resize:vertical;margin-bottom:8px;">' + escapeHtml(request.admin_notes || '') + '</textarea>';
    html += '<button class="btn btn-secondary" id="btn-er-save-notes">' + t('erSaveNotes') + '</button>';

    html += '</div>';
    html += '</div>';

    // AI Conversation (if present)
    if (request.ai_conversation && Array.isArray(request.ai_conversation) && request.ai_conversation.length > 0) {
      html += '<div style="margin-top:24px;border-top:1px solid #2e3140;padding-top:20px;">';
      html += '<h3 style="margin-bottom:12px;font-size:15px;font-weight:700;">🤖 ' + t('erAiConversation') + '</h3>';
      html += '<div style="background:#252833;padding:16px;border-radius:8px;max-height:300px;overflow-y:auto;">';
      request.ai_conversation.forEach(msg => {
        const isUser = msg.role === 'user';
        html += '<div style="margin-bottom:10px;padding:8px 12px;border-radius:8px;font-size:13px;line-height:1.5;' +
          (isUser ? 'background:#6366f1;color:#fff;margin-left:40px;' : 'background:#1a1d27;color:#e8eaf0;margin-right:40px;') +
          '">' + escapeHtml(msg.content || '') + '</div>';
      });
      html += '</div>';
      html += '</div>';
    }

    content.innerHTML = html;

    // Bind status update
    const btnUpdateStatus = document.getElementById('btn-er-update-status');
    const statusSelect = document.getElementById('er-detail-status');
    const rejectionWrap = document.getElementById('er-rejection-wrap');

    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        if (rejectionWrap) {
          rejectionWrap.style.display = (statusSelect.value === 'rejected' || statusSelect.value === 'customer_rejected') ? '' : 'none';
        }
      });
    }

    if (btnUpdateStatus) {
      btnUpdateStatus.addEventListener('click', async () => {
        const newStatus = statusSelect ? statusSelect.value : '';
        const rejectionReason = (document.getElementById('er-rejection-reason') || {}).value || '';

        if (!newStatus) return;

        btnUpdateStatus.disabled = true;
        btnUpdateStatus.textContent = '...';

        try {
          const res = await fetch('/api/edit-requests/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              editRequestId: request.id,
              status: newStatus,
              rejection_reason: newStatus === 'rejected' ? rejectionReason : undefined,
            }),
          });

          if (!res.ok) throw new Error('Update failed');

          showToast(t('erUpdateStatus') + ' ✓', 'success');

          // Update local data
          request.status = newStatus;
          if (newStatus === 'rejected') request.rejection_reason = rejectionReason;

          // Refresh list
          await loadAdminEditRequests();
        } catch (err) {
          console.error('Update edit request status error:', err);
          showToast('Error updating status', 'error');
        } finally {
          btnUpdateStatus.disabled = false;
          btnUpdateStatus.textContent = t('erUpdateStatus');
        }
      });
    }

    // Bind save notes
    const btnSaveNotes = document.getElementById('btn-er-save-notes');
    if (btnSaveNotes) {
      btnSaveNotes.addEventListener('click', async () => {
        const notes = (document.getElementById('er-admin-notes') || {}).value || '';
        btnSaveNotes.disabled = true;
        btnSaveNotes.textContent = '...';

        try {
          const supabaseUrl = supabaseClient.supabaseUrl;
          const supabaseKey = supabaseClient.supabaseKey;

          const res = await fetch(
            supabaseUrl + '/rest/v1/edit_requests?id=eq.' + request.id,
            {
              method: 'PATCH',
              headers: {
                'apikey': supabaseKey,
                'Authorization': 'Bearer ' + supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({ admin_notes: notes }),
            }
          );

          if (!res.ok) throw new Error('Save failed');
          request.admin_notes = notes;
          showToast(t('erSaveNotes') + ' ✓', 'success');
        } catch (err) {
          console.error('Save admin notes error:', err);
          showToast('Error saving notes', 'error');
        } finally {
          btnSaveNotes.disabled = false;
          btnSaveNotes.textContent = t('erSaveNotes');
        }
      });
    }
  }

  function closeEditRequestDetail() {
    const listCard = document.getElementById('er-list-card');
    const detail = document.getElementById('er-detail');
    if (listCard) listCard.style.display = '';
    if (detail) detail.style.display = 'none';
  }

  // Edit request event listeners
  document.addEventListener('view-edit-request', (e) => openEditRequestDetail(e.detail));

  const btnBackEr = document.getElementById('btn-back-er');
  if (btnBackEr) btnBackEr.addEventListener('click', closeEditRequestDetail);

  const erStatusFilter = document.getElementById('er-status-filter');
  if (erStatusFilter) erStatusFilter.addEventListener('change', loadAdminEditRequests);

  const erPriorityFilter = document.getElementById('er-priority-filter');
  if (erPriorityFilter) erPriorityFilter.addEventListener('change', loadAdminEditRequests);

  const erSearch = document.getElementById('er-search');
  if (erSearch) erSearch.addEventListener('input', applyAdminEditRequestFilters);

  // ── Email ──

  async function loadEmailConversations() {
    if (!supabaseClient) return;
    try {
      let query = supabaseClient
        .from('email_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (emailView === 'customers') {
        query = query.not('customer_id', 'is', null);
      } else {
        query = query.is('customer_id', null);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error loading email conversations:', error);
        return;
      }
      emailConversations = data || [];
      renderEmailConversationsList();
    } catch (err) {
      console.error('Load email conversations error:', err);
    }
  }

  function renderEmailConversationsList() {
    const container = document.getElementById('email-conversations-list');
    if (!container) return;
    const searchTerm = (document.getElementById('email-conv-search')?.value || '').toLowerCase();

    const filtered = searchTerm
      ? emailConversations.filter(c => {
          const name = c.sender_name || c.sender_email || '';
          return name.toLowerCase().includes(searchTerm) || (c.sender_email || '').toLowerCase().includes(searchTerm);
        })
      : emailConversations;

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:13px">${t('emailNoConversations')}</div>`;
      return;
    }

    container.innerHTML = filtered.map(c => {
      const displayName = escapeHtml(c.sender_name || c.sender_email || 'Unknown');
      const preview = escapeHtml(c.last_message_text || c.last_message_subject || '');
      const time = c.last_message_at ? formatMessageTime(c.last_message_at) : '';
      const isActive = c.id === activeEmailConversationId;
      const unread = c.unread_count > 0
        ? `<span class="unread-badge">${c.unread_count}</span>`
        : '';
      const initial = (displayName[0] || '?').toUpperCase();

      return `<div class="conversation-item${isActive ? ' active' : ''}" data-email-conv-id="${c.id}">
        <div class="conversation-avatar">${initial}</div>
        <div class="conversation-info">
          <div class="conversation-name">${displayName}</div>
          <div class="conversation-preview">${preview}</div>
        </div>
        <div class="conversation-meta">
          <span class="conversation-time">${time}</span>
          ${unread}
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('.conversation-item').forEach(el => {
      el.addEventListener('click', () => {
        const convId = el.getAttribute('data-email-conv-id');
        openEmailConversation(convId);
      });
    });
  }

  async function openEmailConversation(convId) {
    activeEmailConversationId = convId;
    const conv = emailConversations.find(c => c.id === convId);
    if (!conv) return;

    // Reset unread count
    if (conv.unread_count > 0) {
      conv.unread_count = 0;
      if (supabaseClient) {
        supabaseClient
          .from('email_conversations')
          .update({ unread_count: 0 })
          .eq('id', convId)
          .then(() => {});
      }
    }

    renderEmailConversationsList();
    await loadEmailMessages(convId);
    renderEmailChatView(conv);
  }

  async function loadEmailMessages(conversationId) {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('email_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading email messages:', error);
        return;
      }
      currentEmailMessages = data || [];
    } catch (err) {
      console.error('Load email messages error:', err);
    }
  }

  function renderEmailChatView(conv) {
    const chatPanel = document.getElementById('email-chat-panel');
    if (!chatPanel) return;
    const displayName = escapeHtml(conv.sender_name || conv.sender_email || 'Unknown');
    const emailAddr = escapeHtml(conv.sender_email || '');

    chatPanel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <h3>${displayName}</h3>
          <div class="chat-header-phone">${emailAddr}</div>
        </div>
      </div>
      <div class="chat-messages" id="email-chat-messages"></div>
      <div class="email-reply-area">
        <div class="form-group">
          <label>${t('emailSubject')}</label>
          <input type="text" class="input" id="email-reply-subject" placeholder="${t('emailReplySubjectPh')}" value="${escapeHtml(conv.last_message_subject ? 'Re: ' + conv.last_message_subject.replace(/^Re:\s*/i, '') : '')}">
        </div>
        <div class="email-reply-actions">
          <textarea id="email-reply-input" rows="1" placeholder="${t('emailReplyPlaceholder')}"></textarea>
          <button class="btn-send" id="btn-send-email-reply">${t('emailReply')}</button>
        </div>
      </div>
    `;

    renderEmailMessages();
    bindEmailChatEvents(conv);

    const messagesContainer = document.getElementById('email-chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function renderEmailMessages() {
    const container = document.getElementById('email-chat-messages');
    if (!container) return;

    let lastDate = '';
    container.innerHTML = currentEmailMessages.map(msg => {
      const msgDate = new Date(msg.created_at).toLocaleDateString();
      let dateDivider = '';
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        dateDivider = `<div class="msg-date-divider">${formatDateLabel(msg.created_at)}</div>`;
      }

      const isOutbound = msg.direction === 'outbound';
      const bubbleClass = isOutbound ? 'msg-outbound' : 'msg-inbound';
      const time = formatMessageTime(msg.created_at, true);

      const subjectHtml = msg.subject
        ? `<div class="email-msg-subject">${escapeHtml(msg.subject)}</div>`
        : '';

      let bodyHtml = '';
      if (msg.body_html) {
        bodyHtml = `<div class="email-msg-body">${sanitizeEmailHtml(msg.body_html)}</div>`;
      } else if (msg.body_text) {
        bodyHtml = `<div class="email-msg-body">${escapeHtml(msg.body_text)}</div>`;
      }

      let attachmentHtml = '';
      if (msg.has_attachments && msg.attachment_metadata) {
        try {
          const attachments = typeof msg.attachment_metadata === 'string' ? JSON.parse(msg.attachment_metadata) : msg.attachment_metadata;
          if (Array.isArray(attachments) && attachments.length > 0) {
            attachmentHtml = attachments.map(a =>
              `<span class="email-attachment-chip">&#128206; ${escapeHtml(a.filename || a.name || 'attachment')}</span>`
            ).join(' ');
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      return `${dateDivider}<div class="msg-bubble ${bubbleClass}" data-email-msg-id="${msg.id}">
        ${subjectHtml}
        ${bodyHtml}
        ${attachmentHtml}
        <div class="msg-time">${time}</div>
      </div>`;
    }).join('');
  }

  function bindEmailChatEvents(conv) {
    const replyInput = document.getElementById('email-reply-input');
    const sendBtn = document.getElementById('btn-send-email-reply');

    if (replyInput) {
      replyInput.addEventListener('input', () => {
        replyInput.style.height = 'auto';
        replyInput.style.height = Math.min(replyInput.scrollHeight, 100) + 'px';
      });

      replyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendEmailReply(conv);
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => sendEmailReply(conv));
    }
  }

  async function sendEmailReply(conv) {
    const replyInput = document.getElementById('email-reply-input');
    const subjectInput = document.getElementById('email-reply-subject');
    const text = replyInput?.value?.trim();
    const subject = subjectInput?.value?.trim();
    if (!text) return;

    const sendBtn = document.getElementById('btn-send-email-reply');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = t('emailSending');
    }
    replyInput.value = '';
    replyInput.style.height = 'auto';

    // Optimistic UI
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: conv.id,
      direction: 'outbound',
      from_address: 'andres@ahoratengopagina.com',
      to_addresses: [conv.sender_email],
      subject: subject || '',
      body_text: text,
      body_html: null,
      has_attachments: false,
      status: 'sent',
      created_at: new Date().toISOString(),
    };
    currentEmailMessages.push(optimisticMsg);
    renderEmailMessages();
    const messagesContainer = document.getElementById('email-chat-messages');
    if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const res = await withTimeout(
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conv.id,
            subject: subject || '(no subject)',
            text: text,
          }),
        }),
        15000,
        'Email send'
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Send failed');
      }

      // Update optimistic message
      const idx = currentEmailMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentEmailMessages[idx].id = data.messageId;
        currentEmailMessages[idx].status = 'sent';
      }
      renderEmailMessages();

      // Update conversation preview
      conv.last_message_text = text.substring(0, 200);
      conv.last_message_subject = subject;
      conv.last_message_at = new Date().toISOString();
      renderEmailConversationsList();
    } catch (err) {
      console.error('Send email reply error:', err);
      showToast(t('emailSendError'), 'error');
      const idx = currentEmailMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentEmailMessages[idx].status = 'failed';
      }
      renderEmailMessages();
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = t('emailReply');
      }
    }
  }

  function openComposeModal() {
    const modal = document.getElementById('compose-email-modal');
    if (modal) modal.style.display = '';
    const toInput = document.getElementById('compose-email-to');
    if (toInput) { toInput.value = ''; toInput.focus(); }
    const subjectInput = document.getElementById('compose-email-subject');
    if (subjectInput) subjectInput.value = '';
    const bodyInput = document.getElementById('compose-email-body');
    if (bodyInput) bodyInput.value = '';
  }

  function closeComposeModal() {
    const modal = document.getElementById('compose-email-modal');
    if (modal) modal.style.display = 'none';
  }

  async function sendComposedEmail() {
    const toInput = document.getElementById('compose-email-to');
    const subjectInput = document.getElementById('compose-email-subject');
    const bodyInput = document.getElementById('compose-email-body');
    const sendBtn = document.getElementById('compose-email-send');

    const to = toInput?.value?.trim();
    const subject = subjectInput?.value?.trim();
    const text = bodyInput?.value?.trim();

    if (!to || !subject || !text) return;

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = t('emailSending');
    }

    try {
      const res = await withTimeout(
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, text }),
        }),
        15000,
        'Email compose'
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Send failed');
      }

      showToast(t('emailSent'), 'success');
      closeComposeModal();

      // Reload conversations to show the new one
      await loadEmailConversations();
      if (data.conversationId) {
        openEmailConversation(data.conversationId);
      }
    } catch (err) {
      console.error('Compose email error:', err);
      showToast(t('emailSendError'), 'error');
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = t('emailSendBtn');
      }
    }
  }

  function toggleEmailView(view) {
    emailView = view;
    activeEmailConversationId = null;

    // Update toggle button active states
    const custBtn = document.getElementById('email-toggle-customers');
    const inboxBtn = document.getElementById('email-toggle-inbox');
    if (custBtn) custBtn.classList.toggle('active', view === 'customers');
    if (inboxBtn) inboxBtn.classList.toggle('active', view === 'inbox');

    // Reset chat panel
    const chatPanel = document.getElementById('email-chat-panel');
    if (chatPanel) {
      chatPanel.innerHTML = `<div class="chat-empty" id="email-chat-empty">${t('emailSelectConversation')}</div>`;
    }

    loadEmailConversations();
  }

  function sanitizeEmailHtml(html) {
    if (!html) return '';
    // Remove script, style, iframe, object, embed tags
    let safe = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[\s\S]*?>/gi, '')
      .replace(/<link[\s\S]*?>/gi, '');
    // Remove on* event attributes
    safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    // Remove javascript: URLs
    safe = safe.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"');
    return safe;
  }

  function setupEmailRealtimeSubscription() {
    if (!supabaseClient) return;

    supabaseClient
      .channel('email-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_messages' },
        (payload) => {
          const msg = payload.new;
          if (msg.direction === 'inbound') {
            handleNewInboundEmail(msg);
          }
        }
      )
      .subscribe();
  }

  function handleNewInboundEmail(msg) {
    // If viewing this conversation, append message
    if (msg.conversation_id === activeEmailConversationId) {
      currentEmailMessages.push(msg);
      renderEmailMessages();
      const messagesContainer = document.getElementById('email-chat-messages');
      if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Reset unread since we're viewing
      if (supabaseClient) {
        supabaseClient
          .from('email_conversations')
          .update({ unread_count: 0 })
          .eq('id', msg.conversation_id)
          .then(() => {});
      }
    }

    // Refresh the conversations list
    loadEmailConversations();
  }

  // Email toggle buttons
  const emailToggleCust = document.getElementById('email-toggle-customers');
  if (emailToggleCust) emailToggleCust.addEventListener('click', () => toggleEmailView('customers'));
  const emailToggleInbox = document.getElementById('email-toggle-inbox');
  if (emailToggleInbox) emailToggleInbox.addEventListener('click', () => toggleEmailView('inbox'));

  // Email search
  const emailConvSearch = document.getElementById('email-conv-search');
  if (emailConvSearch) emailConvSearch.addEventListener('input', renderEmailConversationsList);

  // Refresh email
  const btnRefreshEmail = document.getElementById('btn-refresh-email');
  if (btnRefreshEmail) btnRefreshEmail.addEventListener('click', loadEmailConversations);

  // Compose email modal
  const btnComposeEmail = document.getElementById('btn-compose-email');
  if (btnComposeEmail) btnComposeEmail.addEventListener('click', openComposeModal);
  const composeClose = document.getElementById('compose-email-close');
  if (composeClose) composeClose.addEventListener('click', closeComposeModal);
  const composeCancel = document.getElementById('compose-email-cancel');
  if (composeCancel) composeCancel.addEventListener('click', closeComposeModal);
  const composeSend = document.getElementById('compose-email-send');
  if (composeSend) composeSend.addEventListener('click', sendComposedEmail);

  // Close compose modal on overlay click
  const composeModal = document.getElementById('compose-email-modal');
  if (composeModal) {
    composeModal.addEventListener('click', (e) => {
      if (e.target === composeModal) closeComposeModal();
    });
  }

  // ── Email Template Editor ──

  let emailTemplates = [];
  let editingTemplateId = null;
  let gjsEditor = null;
  let editorMode = 'visual'; // 'visual' | 'html'

  const TRIGGER_REGISTRY = {
    employee_invite: {
      en: 'Employee Invite',
      es: 'Invitación de Empleado',
      mergeTags: ['displayName', 'email', 'inviteUrl'],
    },
    customer_welcome: {
      en: 'Customer Welcome',
      es: 'Bienvenida al Cliente',
      mergeTags: ['contactName', 'businessName', 'loginUrl'],
    },
    customer_team_invite: {
      en: 'Customer Team Invite',
      es: 'Invitación de Equipo',
      mergeTags: ['inviterName', 'businessName', 'email', 'inviteUrl'],
    },
    website_published: {
      en: 'Website Published',
      es: 'Sitio Web Publicado',
      mergeTags: ['contactName', 'businessName', 'publishedUrl', 'portalUrl'],
    },
    payment_confirmed: {
      en: 'Payment Confirmed',
      es: 'Pago Confirmado',
      mergeTags: ['contactName', 'businessName', 'amount', 'currency', 'periodEnd'],
    },
    payment_failed: {
      en: 'Payment Failed',
      es: 'Pago Fallido',
      mergeTags: ['contactName', 'businessName', 'amount', 'currency', 'portalUrl'],
    },
    subscription_cancelled: {
      en: 'Subscription Cancelled',
      es: 'Suscripción Cancelada',
      mergeTags: ['contactName', 'businessName', 'portalUrl'],
    },
    website_suspended: {
      en: 'Website Suspended',
      es: 'Sitio Web Suspendido',
      mergeTags: ['contactName', 'businessName', 'portalUrl'],
    },
    website_reactivated: {
      en: 'Website Reactivated',
      es: 'Sitio Web Reactivado',
      mergeTags: ['contactName', 'businessName', 'publishedUrl', 'portalUrl'],
    },
    edit_request_received: {
      en: 'Edit Request Received',
      es: 'Solicitud de Edición Recibida',
      mergeTags: ['contactName', 'businessName', 'requestType', 'description'],
    },
    edit_request_completed: {
      en: 'Edit Request Completed',
      es: 'Solicitud de Edición Completada',
      mergeTags: ['contactName', 'businessName', 'requestType', 'publishedUrl', 'portalUrl'],
    },
    edit_request_rejected: {
      en: 'Edit Request Rejected',
      es: 'Solicitud de Edición Rechazada',
      mergeTags: ['contactName', 'businessName', 'requestType', 'rejectionReason', 'portalUrl'],
    },
    plan_changed: {
      en: 'Plan Changed',
      es: 'Plan Cambiado',
      mergeTags: ['contactName', 'businessName', 'oldPlan', 'newPlan', 'newAmount', 'currency', 'portalUrl'],
    },
  };

  const COMMON_MERGE_TAGS = ['contactName', 'businessName', 'portalUrl', 'publishedUrl', 'email'];

  function getTriggerLabel(key) {
    const entry = TRIGGER_REGISTRY[key];
    if (!entry) return key;
    return currentLang === 'es' ? entry.es : entry.en;
  }

  function getMergeTagsForTrigger(triggerKey) {
    if (triggerKey && TRIGGER_REGISTRY[triggerKey]) {
      return TRIGGER_REGISTRY[triggerKey].mergeTags;
    }
    return COMMON_MERGE_TAGS;
  }

  async function loadTemplates() {
    try {
      const categoryFilter = document.getElementById('templates-category-filter')?.value || '';
      let url = '/api/email-templates/list';
      if (categoryFilter) url += '?category=' + encodeURIComponent(categoryFilter);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load templates');
      emailTemplates = await res.json();
      renderTemplatesList();
      renderFlowsList();
    } catch (err) {
      console.error('Load templates error:', err);
    }
  }

  function renderTemplatesList() {
    const container = document.getElementById('templates-list');
    const noResults = document.getElementById('no-templates');
    if (!container) return;

    if (emailTemplates.length === 0) {
      container.innerHTML = '';
      if (noResults) noResults.style.display = '';
      return;
    }
    if (noResults) noResults.style.display = 'none';

    container.innerHTML = emailTemplates.map(tpl => {
      const catClass = 'template-badge-' + (tpl.category || 'custom');
      const catLabel = t('templatesCat' + capitalize(tpl.category || 'custom'));
      const triggerBadge = tpl.trigger_key
        ? `<span class="template-badge-trigger">${escapeHtml(getTriggerLabel(tpl.trigger_key))}</span>`
        : '';
      const inactiveBadge = tpl.is_active === false
        ? '<span class="template-badge-inactive">Inactive</span>'
        : '';
      return `<div class="template-card" data-template-id="${tpl.id}" onclick="document.dispatchEvent(new CustomEvent('open-template',{detail:'${tpl.id}'}))">
        <div class="template-card-name">${escapeHtml(tpl.name)}</div>
        <div class="template-card-subject">${escapeHtml(tpl.subject || '')}</div>
        <div class="template-card-badges">
          <span class="template-badge-category ${catClass}">${catLabel}</span>
          ${triggerBadge}${inactiveBadge}
        </div>
        <div class="template-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-view" style="font-size:11px;padding:3px 10px" onclick="document.dispatchEvent(new CustomEvent('duplicate-template',{detail:'${tpl.id}'}))">Duplicate</button>
          <button class="btn btn-view" style="font-size:11px;padding:3px 10px;color:var(--danger)" onclick="document.dispatchEvent(new CustomEvent('delete-template',{detail:'${tpl.id}'}))">Delete</button>
        </div>
      </div>`;
    }).join('');
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function renderFlowsList() {
    const container = document.getElementById('flows-list');
    if (!container) return;

    container.innerHTML = Object.entries(TRIGGER_REGISTRY).map(([key, entry]) => {
      const linked = emailTemplates.find(tpl => tpl.trigger_key === key && tpl.is_active);
      const label = currentLang === 'es' ? entry.es : entry.en;
      const templateInfo = linked
        ? `<span class="flow-item-template flow-item-linked">${escapeHtml(linked.name)}</span>`
        : `<span class="flow-item-template flow-item-unlinked">${t('templatesFlowNotLinked')}</span>`;
      return `<div class="flow-item">
        <span class="flow-item-trigger">${escapeHtml(label)}</span>
        ${templateInfo}
      </div>`;
    }).join('');
  }

  function openTemplateEditor(templateId) {
    editingTemplateId = templateId || null;
    editorMode = 'visual';
    const overlay = document.getElementById('template-editor-overlay');
    if (!overlay) return;

    // Reset fields
    document.getElementById('template-editor-name').value = '';
    document.getElementById('template-editor-subject').value = '';
    document.getElementById('template-editor-category').value = 'custom';
    document.getElementById('template-editor-trigger').value = '';
    document.getElementById('template-editor-description').value = '';

    // Populate trigger dropdown
    const triggerSelect = document.getElementById('template-editor-trigger');
    triggerSelect.innerHTML = '<option value="">' + t('templatesTriggerNone') + '</option>';
    Object.entries(TRIGGER_REGISTRY).forEach(([key, entry]) => {
      const label = currentLang === 'es' ? entry.es : entry.en;
      // Check if another template already uses this trigger
      const usedBy = emailTemplates.find(tpl => tpl.trigger_key === key && tpl.id !== editingTemplateId);
      const suffix = usedBy ? ' (in use)' : '';
      triggerSelect.innerHTML += `<option value="${key}"${usedBy ? ' disabled' : ''}>${escapeHtml(label)}${suffix}</option>`;
    });

    let initialHtml = '';

    if (templateId) {
      const tpl = emailTemplates.find(tp => tp.id === templateId);
      if (tpl) {
        document.getElementById('template-editor-name').value = tpl.name || '';
        document.getElementById('template-editor-subject').value = tpl.subject || '';
        document.getElementById('template-editor-category').value = tpl.category || 'custom';
        document.getElementById('template-editor-trigger').value = tpl.trigger_key || '';
        document.getElementById('template-editor-description').value = tpl.description || '';
        initialHtml = tpl.gjs_html || tpl.body_html || '';
      }
    }

    // Show overlay
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Show visual mode
    document.getElementById('gjs-editor').style.display = 'block';
    document.getElementById('template-html-editor').style.display = 'none';
    document.getElementById('template-view-visual').classList.add('active');
    document.getElementById('template-view-html').classList.remove('active');

    // Render merge tags
    updateMergeTagChips();

    // Init GrapesJS (defer to let DOM settle)
    setTimeout(() => initGrapesJS(initialHtml, templateId), 100);
  }

  function initGrapesJS(html, templateId) {
    // Destroy previous instance
    if (gjsEditor) {
      gjsEditor.destroy();
      gjsEditor = null;
    }

    const container = document.getElementById('gjs-editor');
    if (!container) return;

    gjsEditor = grapesjs.init({
      container: '#gjs-editor',
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      plugins: ['grapesjs-preset-newsletter'],
      pluginsOpts: {
        'grapesjs-preset-newsletter': {},
      },
      canvas: {
        styles: [],
      },
      panels: { defaults: [] },
    });

    // Load template content
    if (templateId) {
      const tpl = emailTemplates.find(tp => tp.id === templateId);
      if (tpl && tpl.gjs_components) {
        try {
          gjsEditor.loadProjectData({
            pages: [{ component: tpl.gjs_components, styles: tpl.gjs_styles || [] }],
          });
        } catch (e) {
          console.warn('Failed to load GrapesJS project data, falling back to HTML:', e);
          gjsEditor.setComponents(html);
        }
      } else {
        gjsEditor.setComponents(html);
      }
    } else if (html) {
      gjsEditor.setComponents(html);
    }
  }

  function toggleEditorMode(mode) {
    if (mode === editorMode) return;
    editorMode = mode;

    const gjsEl = document.getElementById('gjs-editor');
    const htmlEl = document.getElementById('template-html-editor');
    const visualBtn = document.getElementById('template-view-visual');
    const htmlBtn = document.getElementById('template-view-html');

    if (mode === 'html') {
      // Sync GrapesJS HTML to textarea
      if (gjsEditor) {
        htmlEl.value = gjsEditor.getHtml() + '\n<style>\n' + gjsEditor.getCss() + '\n</style>';
      }
      gjsEl.style.display = 'none';
      htmlEl.style.display = 'block';
      visualBtn.classList.remove('active');
      htmlBtn.classList.add('active');
    } else {
      // Sync textarea back to GrapesJS
      if (gjsEditor && htmlEl.value) {
        gjsEditor.setComponents(htmlEl.value);
      }
      htmlEl.style.display = 'none';
      gjsEl.style.display = 'block';
      htmlBtn.classList.remove('active');
      visualBtn.classList.add('active');
    }
  }

  function updateMergeTagChips() {
    const container = document.getElementById('merge-tags-container');
    if (!container) return;
    const triggerKey = document.getElementById('template-editor-trigger')?.value || '';
    const tags = getMergeTagsForTrigger(triggerKey);
    container.innerHTML = tags.map(tag =>
      `<span class="merge-tag-chip" onclick="document.dispatchEvent(new CustomEvent('insert-merge-tag',{detail:'${tag}'}))">\u007B\u007B${tag}\u007D\u007D</span>`
    ).join('');
  }

  function insertMergeTag(tag) {
    const tagStr = '{{' + tag + '}}';
    if (editorMode === 'html') {
      const textarea = document.getElementById('template-html-editor');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + tagStr + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + tagStr.length;
        textarea.focus();
      }
    } else if (gjsEditor) {
      // Try inserting into the active RTE editor
      const rte = gjsEditor.RichTextEditor;
      if (rte && rte.getContent) {
        try {
          const sel = gjsEditor.Canvas.getDocument().getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(gjsEditor.Canvas.getDocument().createTextNode(tagStr));
            range.collapse(false);
            return;
          }
        } catch (e) {
          // fallback
        }
      }
      // Fallback: append to selected component
      const selected = gjsEditor.getSelected();
      if (selected) {
        const content = selected.get('content') || '';
        selected.set('content', content + tagStr);
      }
    }
  }

  function stripHtmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async function saveTemplate() {
    const name = document.getElementById('template-editor-name')?.value?.trim();
    const subject = document.getElementById('template-editor-subject')?.value?.trim();
    if (!name || !subject) {
      showToast('Name and subject are required', 'error');
      return;
    }

    // Get HTML from active editor mode
    let bodyHtml = '';
    let gjsComponents = null;
    let gjsStyles = null;
    let gjsHtml = '';

    if (editorMode === 'html') {
      bodyHtml = document.getElementById('template-html-editor')?.value || '';
      gjsHtml = bodyHtml;
    } else if (gjsEditor) {
      bodyHtml = gjsEditor.getHtml() + '\n<style>\n' + gjsEditor.getCss() + '\n</style>';
      gjsHtml = bodyHtml;
      try {
        const projectData = gjsEditor.getProjectData();
        if (projectData.pages && projectData.pages[0]) {
          gjsComponents = projectData.pages[0].frames?.[0]?.component || projectData.pages[0].component || null;
          gjsStyles = projectData.pages[0].frames?.[0]?.styles || projectData.pages[0].styles || null;
        }
      } catch (e) {
        console.warn('Could not extract GrapesJS project data:', e);
      }
    }

    const triggerKey = document.getElementById('template-editor-trigger')?.value || null;

    const payload = {
      name,
      subject,
      body_html: bodyHtml,
      body_text: stripHtmlToText(bodyHtml),
      category: document.getElementById('template-editor-category')?.value || 'custom',
      trigger_key: triggerKey || null,
      description: document.getElementById('template-editor-description')?.value || '',
      gjs_components: gjsComponents,
      gjs_styles: gjsStyles,
      gjs_html: gjsHtml,
      merge_tags: getMergeTagsForTrigger(triggerKey),
      is_active: true,
    };

    if (editingTemplateId) {
      payload.id = editingTemplateId;
    }

    try {
      const res = await fetch('/api/email-templates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      editingTemplateId = saved.id;
      showToast(t('templatesSaved'), 'success');
      // Refresh list in background
      loadTemplates();
    } catch (err) {
      console.error('Save template error:', err);
      showToast(t('templatesSaveError'), 'error');
    }
  }

  function closeTemplateEditor() {
    const overlay = document.getElementById('template-editor-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    if (gjsEditor) {
      gjsEditor.destroy();
      gjsEditor = null;
    }
    editingTemplateId = null;
    editorMode = 'visual';
  }

  async function openPreviewModal() {
    const subject = document.getElementById('template-editor-subject')?.value || '';
    let html = '';
    if (editorMode === 'html') {
      html = document.getElementById('template-html-editor')?.value || '';
    } else if (gjsEditor) {
      html = gjsEditor.getHtml() + '\n<style>\n' + gjsEditor.getCss() + '\n</style>';
    }

    try {
      const res = await fetch('/api/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, subject }),
      });
      if (!res.ok) throw new Error('Preview failed');
      const data = await res.json();

      const modal = document.getElementById('template-preview-modal');
      const subjectEl = document.getElementById('template-preview-subject');
      const iframe = document.getElementById('template-preview-iframe');
      if (subjectEl) subjectEl.innerHTML = '<strong>Subject:</strong> ' + escapeHtml(data.subject || subject);
      if (iframe) {
        iframe.classList.remove('mobile');
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(data.html || html);
        doc.close();
      }
      // Reset desktop/mobile toggle
      document.getElementById('preview-desktop')?.classList.add('active');
      document.getElementById('preview-mobile')?.classList.remove('active');
      if (modal) modal.style.display = 'flex';
    } catch (err) {
      console.error('Preview error:', err);
    }
  }

  async function sendTestEmail() {
    const emailTo = document.getElementById('template-test-email')?.value?.trim();
    if (!emailTo) {
      showToast('Enter an email address', 'error');
      return;
    }

    const subject = document.getElementById('template-editor-subject')?.value || '';
    let html = '';
    if (editorMode === 'html') {
      html = document.getElementById('template-html-editor')?.value || '';
    } else if (gjsEditor) {
      html = gjsEditor.getHtml() + '\n<style>\n' + gjsEditor.getCss() + '\n</style>';
    }

    try {
      const res = await fetch('/api/email-templates/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo, subject, html, text: stripHtmlToText(html) }),
      });
      if (!res.ok) throw new Error('Send failed');
      showToast(t('templatesTestSent'), 'success');
      document.getElementById('template-test-modal').style.display = 'none';
    } catch (err) {
      console.error('Send test error:', err);
      showToast(t('templatesTestError'), 'error');
    }
  }

  async function duplicateTemplate(id) {
    try {
      const res = await fetch('/api/email-templates/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Duplicate failed');
      showToast(t('templatesDuplicated'), 'success');
      loadTemplates();
    } catch (err) {
      console.error('Duplicate template error:', err);
      showToast(t('templatesDuplicateError'), 'error');
    }
  }

  async function deleteTemplate(id) {
    if (!confirm(t('templatesConfirmDelete'))) return;
    try {
      const res = await fetch('/api/email-templates/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast(t('templatesDeleted'), 'success');
      loadTemplates();
    } catch (err) {
      console.error('Delete template error:', err);
      showToast(t('templatesDeleteError'), 'error');
    }
  }

  async function seedTemplates() {
    try {
      const res = await fetch('/api/email-templates/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Seed failed');
      showToast(t('templatesSeeded'), 'success');
      loadTemplates();
    } catch (err) {
      console.error('Seed templates error:', err);
      showToast(t('templatesSeedError'), 'error');
    }
  }

  // ── Template Editor Event Listeners ──

  const btnNewTemplate = document.getElementById('btn-new-template');
  if (btnNewTemplate) btnNewTemplate.addEventListener('click', () => openTemplateEditor(null));

  const btnSeedTemplates = document.getElementById('btn-seed-templates');
  if (btnSeedTemplates) btnSeedTemplates.addEventListener('click', seedTemplates);

  const templatesCategoryFilter = document.getElementById('templates-category-filter');
  if (templatesCategoryFilter) templatesCategoryFilter.addEventListener('change', loadTemplates);

  // Editor topbar
  const templateEditorBack = document.getElementById('template-editor-back');
  if (templateEditorBack) templateEditorBack.addEventListener('click', closeTemplateEditor);

  const templateViewVisual = document.getElementById('template-view-visual');
  if (templateViewVisual) templateViewVisual.addEventListener('click', () => toggleEditorMode('visual'));

  const templateViewHtml = document.getElementById('template-view-html');
  if (templateViewHtml) templateViewHtml.addEventListener('click', () => toggleEditorMode('html'));

  const templateBtnPreview = document.getElementById('template-btn-preview');
  if (templateBtnPreview) templateBtnPreview.addEventListener('click', openPreviewModal);

  const templateBtnTest = document.getElementById('template-btn-test');
  if (templateBtnTest) templateBtnTest.addEventListener('click', () => {
    document.getElementById('template-test-modal').style.display = 'flex';
  });

  const templateBtnSave = document.getElementById('template-btn-save');
  if (templateBtnSave) templateBtnSave.addEventListener('click', saveTemplate);

  // Trigger change updates merge tags
  const templateEditorTrigger = document.getElementById('template-editor-trigger');
  if (templateEditorTrigger) templateEditorTrigger.addEventListener('change', updateMergeTagChips);

  // Preview modal
  const templatePreviewClose = document.getElementById('template-preview-close');
  if (templatePreviewClose) templatePreviewClose.addEventListener('click', () => {
    document.getElementById('template-preview-modal').style.display = 'none';
  });

  const previewDesktop = document.getElementById('preview-desktop');
  const previewMobile = document.getElementById('preview-mobile');
  if (previewDesktop) previewDesktop.addEventListener('click', () => {
    document.getElementById('template-preview-iframe')?.classList.remove('mobile');
    previewDesktop.classList.add('active');
    previewMobile?.classList.remove('active');
  });
  if (previewMobile) previewMobile.addEventListener('click', () => {
    document.getElementById('template-preview-iframe')?.classList.add('mobile');
    previewMobile.classList.add('active');
    previewDesktop?.classList.remove('active');
  });

  // Close preview on overlay click
  const previewModal = document.getElementById('template-preview-modal');
  if (previewModal) previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) previewModal.style.display = 'none';
  });

  // Test email modal
  const templateTestClose = document.getElementById('template-test-close');
  if (templateTestClose) templateTestClose.addEventListener('click', () => {
    document.getElementById('template-test-modal').style.display = 'none';
  });

  const templateTestCancel = document.getElementById('template-test-cancel');
  if (templateTestCancel) templateTestCancel.addEventListener('click', () => {
    document.getElementById('template-test-modal').style.display = 'none';
  });

  const templateTestSend = document.getElementById('template-test-send');
  if (templateTestSend) templateTestSend.addEventListener('click', sendTestEmail);

  const testModal = document.getElementById('template-test-modal');
  if (testModal) testModal.addEventListener('click', (e) => {
    if (e.target === testModal) testModal.style.display = 'none';
  });

  // Custom event handlers for template cards (since they use innerHTML)
  document.addEventListener('open-template', (e) => openTemplateEditor(e.detail));
  document.addEventListener('duplicate-template', (e) => duplicateTemplate(e.detail));
  document.addEventListener('delete-template', (e) => deleteTemplate(e.detail));
  document.addEventListener('insert-merge-tag', (e) => insertMergeTag(e.detail));

  // ── Team Management ──
  let teamEmployees = [];

  async function loadTeamEmployees() {
    const auth = window.__employeeAuth;
    if (!auth || auth.employee.role !== 'admin') return;
    const tbody = document.getElementById('team-table-body');
    if (!tbody) return;

    try {
      const session = await auth.supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/employees/list', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      if (!res.ok) throw new Error('Failed to load');
      teamEmployees = await res.json();
      renderTeamTable();
    } catch (err) {
      console.error('Load team error:', err);
      showToast(t('teamLoadError'), 'error');
    }
  }

  function renderTeamTable() {
    const tbody = document.getElementById('team-table-body');
    if (!tbody) return;

    if (teamEmployees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">${t('teamNoEmployees')}</td></tr>`;
      return;
    }

    tbody.innerHTML = teamEmployees.map(emp => {
      const roleBadge = emp.role === 'admin'
        ? `<span class="team-badge team-badge-admin">${t('teamRoleAdmin')}</span>`
        : `<span class="team-badge team-badge-employee">${t('teamRoleEmployee')}</span>`;
      const statusBadge = emp.is_active
        ? `<span class="team-badge team-badge-active">${emp.joined_at ? t('teamStatusActive') : t('teamStatusPending')}</span>`
        : `<span class="team-badge team-badge-inactive">${t('teamStatusInactive')}</span>`;
      const joinedDate = emp.joined_at ? new Date(emp.joined_at).toLocaleDateString() : '—';
      const isCurrentUser = window.__employeeAuth && emp.auth_user_id === window.__employeeAuth.user.id;
      const isPending = emp.is_active && !emp.joined_at;
      const resendBtn = isPending ? ` <button class="btn btn-view" data-emp-id="${emp.id}" data-action="resend" style="font-size:11px;padding:3px 10px">${t('teamResend')}</button>` : '';
      const actionBtn = isCurrentUser ? '<span style="color:var(--text-dim);font-size:12px">You</span>'
        : emp.is_active
        ? `<button class="btn btn-view" data-emp-id="${emp.id}" data-action="deactivate" style="font-size:11px;padding:3px 10px">${t('teamDeactivate')}</button>${resendBtn}`
        : `<button class="btn btn-view" data-emp-id="${emp.id}" data-action="activate" style="font-size:11px;padding:3px 10px">${t('teamActivate')}</button>`;
      return `<tr>
        <td>${escapeHtml(emp.display_name || '—')}</td>
        <td>${escapeHtml(emp.email)}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>${joinedDate}</td>
        <td>${actionBtn}</td>
      </tr>`;
    }).join('');

    // Bind action buttons
    tbody.querySelectorAll('[data-emp-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const empId = btn.dataset.empId;
        const action = btn.dataset.action;
        if (action === 'resend') {
          resendEmployeeInvite(empId, btn);
        } else {
          toggleEmployeeActive(empId, action === 'activate');
        }
      });
    });
  }

  async function inviteEmployee() {
    const auth = window.__employeeAuth;
    if (!auth || auth.employee.role !== 'admin') return;

    const emailInput = document.getElementById('invite-email');
    const nameInput = document.getElementById('invite-name');
    const btn = document.getElementById('btn-invite-employee');
    const email = (emailInput.value || '').trim();
    const displayName = (nameInput.value || '').trim();

    if (!email) {
      emailInput.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = t('teamInviting');

    try {
      const session = await auth.supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ email, display_name: displayName }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invite failed');
      }
      const newEmployee = await res.json();
      teamEmployees.push(newEmployee);
      renderTeamTable();
      emailInput.value = '';
      nameInput.value = '';
      showToast(t('teamInviteSuccess', email), 'success');
    } catch (err) {
      console.error('Invite error:', err);
      showToast(t('teamInviteError') + ': ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = t('teamInvite');
    }
  }

  async function toggleEmployeeActive(empId, activate) {
    const auth = window.__employeeAuth;
    if (!auth || auth.employee.role !== 'admin') return;

    try {
      const session = await auth.supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/employees/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ id: empId, is_active: activate }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      const idx = teamEmployees.findIndex(e => e.id === empId);
      if (idx >= 0 && updated.length > 0) teamEmployees[idx] = updated[0];
      renderTeamTable();
      showToast(t('teamUpdateSuccess'), 'success');
    } catch (err) {
      console.error('Toggle employee error:', err);
      showToast(t('teamUpdateError'), 'error');
    }
  }

  async function resendEmployeeInvite(empId, btn) {
    const auth = window.__employeeAuth;
    if (!auth || auth.employee.role !== 'admin') return;

    const emp = teamEmployees.find(e => e.id === empId);
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = t('teamResending');

    try {
      const session = await auth.supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/employees/resend-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ employee_id: empId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Resend failed');
      }
      showToast(t('teamResendSuccess', emp ? emp.email : ''), 'success');
    } catch (err) {
      console.error('Resend invite error:', err);
      showToast(t('teamResendError') + ': ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  // Team event listeners
  const btnInvite = document.getElementById('btn-invite-employee');
  if (btnInvite) btnInvite.addEventListener('click', inviteEmployee);

  // ── Mobile Bottom Nav ──
  let mobileActiveGroup = 'pipeline';

  function initMobileNav() {
    const bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) return;

    bottomNav.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        selectMobileGroup(group);
        // If tapping a group, switch to its default tab
        const config = NAV_GROUPS[group];
        if (config && config.defaultTab) {
          // For settings, only switch if the user is admin (team tab exists)
          if (group === 'settings') {
            if (window.__employeeAuth && window.__employeeAuth.employee.role === 'admin') {
              switchTab(config.defaultTab);
            }
            // Otherwise just show the sub-nav (lang toggle only)
          } else {
            switchTab(config.defaultTab);
          }
        }
      });
    });

    // Initialize with pipeline group
    selectMobileGroup('pipeline');
  }

  function selectMobileGroup(group) {
    mobileActiveGroup = group;
    const bottomNav = document.getElementById('bottom-nav');
    const subNavRow = document.getElementById('sub-nav-row');
    if (!bottomNav || !subNavRow) return;

    // Update bottom nav active state
    bottomNav.querySelectorAll('.bottom-nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.group === group);
    });

    // Build sub-nav pills
    const config = NAV_GROUPS[group];
    if (!config) { subNavRow.style.display = 'none'; return; }

    let html = '';
    config.items.forEach(item => {
      if (item.adminOnly && (!window.__employeeAuth || window.__employeeAuth.employee.role !== 'admin')) return;
      if (item.isLangToggle) {
        html += '<button class="sub-nav-pill ' + (currentLang === 'en' ? 'active' : '') + '" data-lang-toggle="en">EN</button>';
        html += '<button class="sub-nav-pill ' + (currentLang === 'es' ? 'active' : '') + '" data-lang-toggle="es">ES</button>';
        return;
      }
      if (item.href) {
        html += '<a href="' + item.href + '" class="sub-nav-pill">' + t(item.label) + '</a>';
      } else {
        var isActive = activeTab === item.tab;
        html += '<button class="sub-nav-pill ' + (isActive ? 'active' : '') + '" data-tab="' + item.tab + '">' + t(item.label) + '</button>';
      }
    });

    subNavRow.innerHTML = html;
    subNavRow.style.display = '';
    subNavRow.classList.add('visible');

    // Bind sub-nav pill clicks
    subNavRow.querySelectorAll('[data-tab]').forEach(pill => {
      pill.addEventListener('click', () => {
        switchTab(pill.dataset.tab);
      });
    });

    subNavRow.querySelectorAll('[data-lang-toggle]').forEach(pill => {
      pill.addEventListener('click', () => {
        currentLang = pill.dataset.langToggle;
        localStorage.setItem('app_lang', currentLang);
        applyLanguage();
        // Re-render sub-nav to update active states
        selectMobileGroup('settings');
      });
    });
  }

  function updateMobileNav(tab) {
    const group = TAB_TO_GROUP[tab];
    if (group && group !== mobileActiveGroup) {
      selectMobileGroup(group);
    }
    // Update pill active state within current group
    const subNavRow = document.getElementById('sub-nav-row');
    if (subNavRow) {
      subNavRow.querySelectorAll('.sub-nav-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.tab === tab);
      });
    }
  }

  // ── Start ──
  // Wait for auth guard (auth.js) to verify employee before initializing
  function startApp() {
    // Show the app container (hidden until auth passes)
    const appEl = document.getElementById('app');
    if (appEl) appEl.style.display = '';
    // Show user info in header
    if (window.__employeeAuth) {
      const nameEl = document.getElementById('header-user-name');
      const infoEl = document.getElementById('header-user-info');
      if (nameEl && window.__employeeAuth.employee.display_name) {
        nameEl.textContent = window.__employeeAuth.employee.display_name;
      } else if (nameEl) {
        nameEl.textContent = window.__employeeAuth.employee.email;
      }
      if (infoEl) infoEl.style.display = '';
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) logoutBtn.addEventListener('click', () => window.__employeeAuth.signOut());
      // Show Team tab for admins
      if (window.__employeeAuth.employee.role === 'admin') {
        const teamTab = document.getElementById('nav-team');
        if (teamTab) teamTab.style.display = '';
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        init();
        initMobileNav();
        // Handle cross-page nav via URL hash (e.g. /employee/admin#messaging)
        var hash = window.location.hash.replace('#', '');
        if (hash && NAV_GROUPS[hash]) {
          switchTab(NAV_GROUPS[hash].defaultTab);
        }
      });
    } else {
      init();
      initMobileNav();
      var hash = window.location.hash.replace('#', '');
      if (hash && NAV_GROUPS[hash]) {
        switchTab(NAV_GROUPS[hash].defaultTab);
      }
    }
  }

  if (window.__employeeAuth) {
    startApp();
  } else {
    document.addEventListener('employee-auth-ready', startApp);
  }
})();
