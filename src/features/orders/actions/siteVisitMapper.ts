import { SiteVisitDetails, SignLocation } from "@/types";

export function mapSiteVisitFromDb(sv: any): SiteVisitDetails | null {
  if (!sv) return null;

  return {
    completed: sv.completed || false,
    
    // Stage 1
    customerAddress: sv.customer_address,
    landmark: sv.landmark,
    preferredDate: sv.preferred_date,
    preferredTime: sv.preferred_time,
    gpsLocation: sv.gps_location,
    customerContact: sv.customer_contact,

    // Stage 2
    sitePersonnel: sv.site_personnel,
    auditDate: sv.audit_date,
    auditTime: sv.audit_time,
    availableSlots: sv.available_slots || [],

    // Stage 3
    checkedIn: sv.checked_in,
    checkInTime: sv.check_in_time,
    checkInGps: sv.check_in_gps,
    checkInTimerStart: sv.check_in_timer_start,
    elapsedDuration: sv.elapsed_duration,

    // Staff execution
    visitStarted: sv.visit_started,
    visitStartTimestamp: sv.visit_start_timestamp,
    startGpsLocation: sv.start_gps_location,
    startDeviceInfo: sv.start_device_info,
    
    distanceToPowerSource: sv.distance_to_power_source,
    distanceToPowerSourceUnit: sv.distance_to_power_source_unit,
    electricalNotes: sv.electrical_notes,
    audioNoteUrl: sv.audio_note_url,
    surfaceCondition: sv.surface_condition,
    obstacles: sv.obstacles || [],
    customerBudget: sv.customer_budget,
    expectedTimeline: sv.expected_timeline,
    customerPreferences: sv.customer_preferences,
    competitorReferences: sv.competitor_references,
    suggestedProductType: sv.suggested_product_type,
    additionalObservations: sv.additional_observations,

    contactPerson: sv.contact_person,

    powerAvailable: sv.power_available,
    electricalPhotos: sv.electrical_photos || [],

    wallType: sv.wall_type,
    mountingMethod: sv.mounting_method,
    structuralNotes: sv.structural_notes,

    internalNotes: sv.internal_notes || {},
    photoCategories: {
      front: sv.photo_categories?.front || [],
      installationArea: sv.photo_categories?.installationArea || [],
      powerSource: sv.photo_categories?.powerSource || [],
      measurementReference: sv.photo_categories?.measurementReference || [],
      additional: sv.photo_categories?.additional || []
    },

    reviewStatus: sv.review_status,
    reviewNotes: sv.review_notes,
    auditTrail: sv.audit_trail || [],


    // Locations
    locations: (sv.site_visit_measurements || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      width: m.width,
      height: m.height,
      depth: m.depth,
      groundClearance: m.ground_clearance,
      notes: m.notes,
      photos: m.photos || []
    }))
  };
}

export function mapSiteVisitToDb(orderId: string, companyId: string, details: Partial<SiteVisitDetails>): any {
  return {
    order_id: orderId,
    company_id: companyId,
    completed: details.completed,
    
    customer_address: details.customerAddress,
    landmark: details.landmark,
    preferred_date: details.preferredDate,
    preferred_time: details.preferredTime,
    gps_location: details.gpsLocation,
    customer_contact: details.customerContact,

    site_personnel: details.sitePersonnel,
    audit_date: details.auditDate,
    audit_time: details.auditTime,
    available_slots: details.availableSlots,

    checked_in: details.checkedIn,
    check_in_time: details.checkInTime,
    check_in_gps: details.checkInGps,
    check_in_timer_start: details.checkInTimerStart,
    elapsed_duration: details.elapsedDuration,

    visit_started: details.visitStarted,
    visit_start_timestamp: details.visitStartTimestamp,
    start_gps_location: details.startGpsLocation,
    start_device_info: details.startDeviceInfo,
    
    distance_to_power_source: details.distanceToPowerSource,
    distance_to_power_source_unit: details.distanceToPowerSourceUnit,
    electrical_notes: details.electricalNotes,
    audio_note_url: details.audioNoteUrl,
    surface_condition: details.surfaceCondition,
    obstacles: details.obstacles,
    customer_budget: details.customerBudget,
    expected_timeline: details.expectedTimeline,
    customer_preferences: details.customerPreferences,
    competitor_references: details.competitorReferences,
    suggested_product_type: details.suggestedProductType,
    additional_observations: details.additionalObservations,

    contact_person: details.contactPerson,

    power_available: details.powerAvailable,
    electrical_photos: details.electricalPhotos,

    wall_type: details.wallType,
    mounting_method: details.mountingMethod,
    structural_notes: details.structuralNotes,

    internal_notes: details.internalNotes,
    photo_categories: details.photoCategories,

    review_status: details.reviewStatus,
    review_notes: details.reviewNotes,
    audit_trail: details.auditTrail,

  };
}
