import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  Building2,
  FileText,
  Hash,
  MapPin,
  Building,
  Map,
  Navigation,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function BecomeGroundOwnerModal({ isOpen, onClose, onAddGround }) {
  // Step state: 1 (Ground Details) -> 2 (Location) -> 3 (Pricing & Facilities) -> 4 (Success)
  const [step, setStep] = useState(1);

  // Form Data State
  const [groundData, setGroundData] = useState({
    groundName: '',
    groundTypes: ['Football', 'Badminton'],
    numberOfCourts: '2',
    description: '',
  });

  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: '11.2588',
    lng: '75.7804',
  });

  const [pricingFacilitiesData, setPricingFacilitiesData] = useState({
    pricePerHour: '800',
    openingTime: '06:00 AM',
    closingTime: '11:00 PM',
    facilities: ['Parking', 'Changing Room', 'Washroom', 'Lighting', 'Wi-Fi'],
    groundImages: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80',
    ],
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  // Available Sports Options
  const sportOptions = [
    { name: 'Football', icon: '⚽' },
    { name: 'Badminton', icon: '🏸' },
    { name: 'Cricket', icon: '🏏' },
    { name: 'Basketball', icon: '🏀' },
    { name: 'Tennis', icon: '🎾' },
    { name: 'Volleyball', icon: '🏐' },
    { name: 'Hockey', icon: '🏒' },
    { name: 'Other', icon: '🥅' },
  ];

  // Available Facilities Options
  const facilityOptions = [
    { name: 'Parking', icon: '🅿️' },
    { name: 'Changing Room', icon: '👕' },
    { name: 'Washroom', icon: '🚻' },
    { name: 'Lighting', icon: '💡' },
    { name: 'Drinking Water', icon: '🚰' },
    { name: 'Equipment Rental', icon: '🎒' },
    { name: 'Cafeteria', icon: '☕' },
    { name: 'Wi-Fi', icon: '📶' },
    { name: 'First Aid', icon: '🩹' },
  ];

  // Toggle sport selection
  const toggleSport = (sportName) => {
    setGroundData((prev) => {
      const exists = prev.groundTypes.includes(sportName);
      if (exists) {
        return { ...prev, groundTypes: prev.groundTypes.filter((s) => s !== sportName) };
      } else {
        return { ...prev, groundTypes: [...prev.groundTypes, sportName] };
      }
    });
  };

  // Toggle facility selection
  const toggleFacility = (facilityName) => {
    setPricingFacilitiesData((prev) => {
      const exists = prev.facilities.includes(facilityName);
      if (exists) {
        return { ...prev, facilities: prev.facilities.filter((f) => f !== facilityName) };
      } else {
        return { ...prev, facilities: [...prev.facilities, facilityName] };
      }
    });
  };

  const handleAddGroundImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPricingFacilitiesData((prev) => ({
        ...prev,
        groundImages: [...prev.groundImages, url],
      }));
    }
  };

  const handleRemoveGroundImage = (index) => {
    setPricingFacilitiesData((prev) => ({
      ...prev,
      groundImages: prev.groundImages.filter((_, i) => i !== index),
    }));
  };

  // Geolocation Handler
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationData((prev) => ({
            ...prev,
            lat: pos.coords.latitude.toFixed(4),
            lng: pos.coords.longitude.toFixed(4),
            address: prev.address || 'Sports Complex, Station Road',
            city: prev.city || 'Kozhikode',
            state: prev.state || 'Kerala',
          }));
          setIsLocating(false);
        },
        () => {
          setTimeout(() => {
            setLocationData((prev) => ({
              ...prev,
              lat: '11.2588',
              lng: '75.7804',
              city: prev.city || 'Kozhikode',
              state: prev.state || 'Kerala',
            }));
            setIsLocating(false);
          }, 500);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Step Validation
  const validateStep = (targetStep) => {
    const errs = {};
    if (targetStep === 1) {
      if (!groundData.groundName.trim()) errs.groundName = 'Ground Name is required';
      if (groundData.groundTypes.length === 0) errs.groundTypes = 'Select at least one ground type';
    } else if (targetStep === 2) {
      if (!locationData.address.trim()) errs.address = 'Address is required';
      if (!locationData.city.trim()) errs.city = 'City is required';
    } else if (targetStep === 3) {
      if (!pricingFacilitiesData.pricePerHour) errs.pricePerHour = 'Price per hour is required';
      if (pricingFacilitiesData.groundImages.length < 3) {
        errs.groundImages = 'Minimum 3 ground images required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitForm = () => {
    if (validateStep(3)) {
      const newGround = {
        title: groundData.groundName || 'SportVerse Arena',
        sport_type: groundData.groundTypes[0] || 'Football',
        location: `${locationData.city || 'City Center'}, ${locationData.state || 'State'}`,
        address: locationData.address || 'Sports Complex Zone',
        price_per_hour: Number(pricingFacilitiesData.pricePerHour) || 800,
        facilities: pricingFacilitiesData.facilities,
        images: pricingFacilitiesData.groundImages,
        owner_id: 101,
        status: 'Under Review',
        rating: 5.0,
        review_count: 1,
        ai_score: 98,
      };

      if (onAddGround) {
        onAddGround(newGround);
      }
      setStep(4);
    }
  };

  // Color Palette matching SportVerse App Theme (Warm Bronze Gold & Dark Obsidian)
  const themeStyles = {
    modalBg: '#151311',
    cardHeaderBg: '#0F0D0B',
    textColor: '#FCFBF8',
    textMuted: '#A39C93',
    inputBg: '#0B0B0B',
    inputBorder: 'rgba(231, 227, 221, 0.15)',
    primaryBtn: 'linear-gradient(135deg, #c8895b 0%, #a76f45 100%)',
    primaryBtnShadow: '0 4px 14px rgba(200, 137, 91, 0.35)',
    activeStepBg: '#c8895b',
    activeStepText: '#FFFFFF',
    chipSelectedBg: 'rgba(200, 137, 91, 0.18)',
    chipSelectedBorder: '#c8895b',
    chipSelectedText: '#e5ba93',
    mapBg: '#1E1B18',
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{
          ...styles.modalContainer,
          backgroundColor: themeStyles.modalBg,
          color: themeStyles.textColor,
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
      >
        {/* Header Bar */}
        <div style={{ ...styles.headerBar, background: themeStyles.cardHeaderBg, borderColor: themeStyles.inputBorder }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {step > 1 && step < 4 ? (
              <button style={styles.backBtn} onClick={handlePrevStep} title="Back">
                <ChevronLeft size={20} color={themeStyles.textColor} />
              </button>
            ) : (
              <div style={styles.iconCircle}>
                <Building2 size={18} color="#c8895b" />
              </div>
            )}
            <div>
              <h2 style={{ ...styles.modalTitle, color: themeStyles.textColor }}>Become a Ground Owner</h2>
              <span style={{ fontSize: '0.75rem', color: themeStyles.textMuted }}>SportVerse AI Arena Listing</span>
            </div>
          </div>

          <button style={styles.closeBtn} onClick={onClose} title="Close Modal">
            <X size={20} color={themeStyles.textMuted} />
          </button>
        </div>

        {/* Stepper Progress Indicator (3 Steps) */}
        {step <= 3 && (
          <div style={{ ...styles.stepperContainer, borderColor: themeStyles.inputBorder }}>
            <div style={styles.stepperTrack}>
              {[
                { num: 1, label: 'Ground Details' },
                { num: 2, label: 'Location' },
                { num: 3, label: 'Pricing & Facilities' },
              ].map((s, idx) => {
                const isCompleted = step > s.num;
                const isActive = step === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div style={styles.stepItem} onClick={() => isCompleted && setStep(s.num)}>
                      <div
                        style={{
                          ...styles.stepCircle,
                          backgroundColor: isActive
                            ? themeStyles.activeStepBg
                            : isCompleted
                            ? '#c8895b'
                            : 'transparent',
                          borderColor: isActive || isCompleted ? '#c8895b' : themeStyles.inputBorder,
                          color: isActive || isCompleted ? '#FFFFFF' : themeStyles.textMuted,
                        }}
                      >
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : s.num}
                      </div>
                      <span
                        style={{
                          ...styles.stepLabel,
                          color: isActive || isCompleted ? '#e5ba93' : themeStyles.textMuted,
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        style={{
                          ...styles.stepLine,
                          backgroundColor: step > s.num ? '#c8895b' : themeStyles.inputBorder,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div style={styles.modalBody}>
          {/* STEP 1: GROUND DETAILS */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: themeStyles.textColor, marginBottom: '1rem' }}>
                Ground Information
              </div>

              {/* Ground Name */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Ground Name</label>
                <div style={styles.inputWrapper}>
                  <Building2 size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Enter ground name"
                    value={groundData.groundName}
                    onChange={(e) => setGroundData({ ...groundData, groundName: e.target.value })}
                    style={{
                      ...styles.styledInput,
                      backgroundColor: themeStyles.inputBg,
                      borderColor: errors.groundName ? '#EF4444' : themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }}
                  />
                </div>
                {errors.groundName && <span style={styles.errorText}>{errors.groundName}</span>}
              </div>

              {/* Ground Type (Select all that apply) */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>
                  Ground Type <span style={{ fontWeight: 400, textTransform: 'none' }}>(Select all that apply)</span>
                </label>

                <div style={styles.chipGrid}>
                  {sportOptions.map((sport) => {
                    const isSelected = groundData.groundTypes.includes(sport.name);
                    return (
                      <div
                        key={sport.name}
                        onClick={() => toggleSport(sport.name)}
                        style={{
                          ...styles.chipItem,
                          backgroundColor: isSelected ? themeStyles.chipSelectedBg : themeStyles.inputBg,
                          borderColor: isSelected ? themeStyles.chipSelectedBorder : themeStyles.inputBorder,
                          color: isSelected ? themeStyles.chipSelectedText : themeStyles.textColor,
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{sport.icon}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 700 : 500 }}>{sport.name}</span>
                        {isSelected && <CheckCircle2 size={16} color="#c8895b" style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>
                {errors.groundTypes && <span style={styles.errorText}>{errors.groundTypes}</span>}
              </div>

              {/* Number of Courts / Grounds */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Number of Courts / Grounds</label>
                <div style={styles.inputWrapper}>
                  <Hash size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                  <input
                    type="number"
                    placeholder="Enter number"
                    value={groundData.numberOfCourts}
                    onChange={(e) => setGroundData({ ...groundData, numberOfCourts: e.target.value })}
                    style={{
                      ...styles.styledInput,
                      backgroundColor: themeStyles.inputBg,
                      borderColor: themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Description</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={4}
                    maxLength={300}
                    placeholder="Tell users about your ground, facilities and special features..."
                    value={groundData.description}
                    onChange={(e) => setGroundData({ ...groundData, description: e.target.value })}
                    style={{
                      ...styles.styledTextarea,
                      backgroundColor: themeStyles.inputBg,
                      borderColor: themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }}
                  />
                  <span style={{ ...styles.charCounter, color: themeStyles.textMuted }}>
                    {groundData.description.length}/300
                  </span>
                </div>
              </div>

              {/* Bottom Action */}
              <div style={{ marginTop: '1.75rem' }}>
                <button
                  style={{
                    ...styles.fullBtn,
                    background: themeStyles.primaryBtn,
                    boxShadow: themeStyles.primaryBtnShadow,
                  }}
                  onClick={handleNextStep}
                >
                  <span>Continue</span>
                  <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: themeStyles.textColor, marginBottom: '1rem' }}>
                Location
              </div>

              {/* Address */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Address</label>
                <div style={styles.inputWrapper}>
                  <MapPin size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Enter complete ground address"
                    value={locationData.address}
                    onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                    style={{
                      ...styles.styledInput,
                      backgroundColor: themeStyles.inputBg,
                      borderColor: errors.address ? '#EF4444' : themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }}
                  />
                </div>
                {errors.address && <span style={styles.errorText}>{errors.address}</span>}
              </div>

              {/* City & State */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>City</label>
                  <div style={styles.inputWrapper}>
                    <Building size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Enter city"
                      value={locationData.city}
                      onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                      style={{
                        ...styles.styledInput,
                        backgroundColor: themeStyles.inputBg,
                        borderColor: errors.city ? '#EF4444' : themeStyles.inputBorder,
                        color: themeStyles.textColor,
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>State</label>
                  <div style={styles.inputWrapper}>
                    <Map size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Enter state"
                      value={locationData.state}
                      onChange={(e) => setLocationData({ ...locationData, state: e.target.value })}
                      style={{
                        ...styles.styledInput,
                        backgroundColor: themeStyles.inputBg,
                        borderColor: themeStyles.inputBorder,
                        color: themeStyles.textColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* PIN Code */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>PIN Code</label>
                <div style={styles.inputWrapper}>
                  <Hash size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Enter PIN code"
                    value={locationData.pincode}
                    onChange={(e) => setLocationData({ ...locationData, pincode: e.target.value })}
                    style={{
                      ...styles.styledInput,
                      backgroundColor: themeStyles.inputBg,
                      borderColor: themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }}
                  />
                </div>
              </div>

              {/* Locate Your Ground (Interactive Map Simulation) */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Locate your ground</label>

                <div style={{ ...styles.mapMockup, backgroundColor: themeStyles.mapBg, borderColor: themeStyles.inputBorder }}>
                  <div style={styles.mapGridPattern} />
                  <div style={styles.mapPinContainer}>
                    <MapPin size={32} color="#EF4444" fill="#EF4444" style={styles.animatedPin} />
                    <div style={styles.mapPinPulse} />
                  </div>

                  <div style={styles.mapOverlayPill}>
                    📍 {locationData.address || locationData.city || 'Station Sports Complex'}
                  </div>
                </div>

                {/* Map Quick Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    style={{
                      ...styles.mapActionBtn,
                      backgroundColor: 'rgba(200, 137, 91, 0.12)',
                      borderColor: '#c8895b',
                      color: '#E5BA93',
                    }}
                    onClick={handleUseCurrentLocation}
                  >
                    <Navigation size={14} />
                    <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.mapActionBtn,
                      backgroundColor: themeStyles.inputBg,
                      borderColor: themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }}
                    onClick={() => {
                      setLocationData((prev) => ({
                        ...prev,
                        lat: (11.2 + Math.random() * 0.1).toFixed(4),
                        lng: (75.7 + Math.random() * 0.1).toFixed(4),
                      }));
                    }}
                  >
                    <MapPin size={14} />
                    <span>Select on Map</span>
                  </button>
                </div>
              </div>

              {/* Lat & Long */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Latitude</label>
                  <div style={styles.inputWrapper}>
                    <Navigation size={16} color={themeStyles.textMuted} style={styles.inputIcon} />
                    <input
                      type="text"
                      readOnly
                      value={locationData.lat}
                      style={{
                        ...styles.styledInput,
                        backgroundColor: themeStyles.inputBg,
                        borderColor: themeStyles.inputBorder,
                        color: themeStyles.textColor,
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Longitude</label>
                  <div style={styles.inputWrapper}>
                    <Navigation size={16} color={themeStyles.textMuted} style={styles.inputIcon} />
                    <input
                      type="text"
                      readOnly
                      value={locationData.lng}
                      style={{
                        ...styles.styledInput,
                        backgroundColor: themeStyles.inputBg,
                        borderColor: themeStyles.inputBorder,
                        color: themeStyles.textColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div style={{ marginTop: '1.75rem' }}>
                <button
                  style={{
                    ...styles.fullBtn,
                    background: themeStyles.primaryBtn,
                    boxShadow: themeStyles.primaryBtnShadow,
                  }}
                  onClick={handleNextStep}
                >
                  <span>Continue</span>
                  <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRICING & FACILITIES */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: themeStyles.textColor, marginBottom: '1rem' }}>
                Pricing & Facilities
              </div>

              {/* Price per Hour */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Price per Hour</label>
                <div style={styles.inputWrapper}>
                  <span style={{ ...styles.currencyPrefix, color: '#c8895b' }}>₹</span>
                  <input
                    type="number"
                    placeholder="Enter price per hour"
                    value={pricingFacilitiesData.pricePerHour}
                    onChange={(e) => setPricingFacilitiesData({ ...pricingFacilitiesData, pricePerHour: e.target.value })}
                    style={{
                      ...styles.styledInput,
                      paddingLeft: '2.5rem',
                      backgroundColor: themeStyles.inputBg,
                      borderColor: errors.pricePerHour ? '#EF4444' : themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }}
                  />
                </div>
                {errors.pricePerHour && <span style={styles.errorText}>{errors.pricePerHour}</span>}
              </div>

              {/* Opening Time & Closing Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Opening Time</label>
                  <div style={styles.inputWrapper}>
                    <Clock size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                    <select
                      value={pricingFacilitiesData.openingTime}
                      onChange={(e) => setPricingFacilitiesData({ ...pricingFacilitiesData, openingTime: e.target.value })}
                      style={{
                        ...styles.styledSelect,
                        backgroundColor: themeStyles.inputBg,
                        borderColor: themeStyles.inputBorder,
                        color: themeStyles.textColor,
                      }}
                    >
                      <option value="05:00 AM">05:00 AM</option>
                      <option value="06:00 AM">06:00 AM</option>
                      <option value="07:00 AM">07:00 AM</option>
                      <option value="08:00 AM">08:00 AM</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>Closing Time</label>
                  <div style={styles.inputWrapper}>
                    <Clock size={18} color={themeStyles.textMuted} style={styles.inputIcon} />
                    <select
                      value={pricingFacilitiesData.closingTime}
                      onChange={(e) => setPricingFacilitiesData({ ...pricingFacilitiesData, closingTime: e.target.value })}
                      style={{
                        ...styles.styledSelect,
                        backgroundColor: themeStyles.inputBg,
                        borderColor: themeStyles.inputBorder,
                        color: themeStyles.textColor,
                      }}
                    >
                      <option value="10:00 PM">10:00 PM</option>
                      <option value="11:00 PM">11:00 PM</option>
                      <option value="12:00 AM">12:00 AM</option>
                      <option value="01:00 AM">01:00 AM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Facilities (Select all that apply) */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>
                  Facilities <span style={{ fontWeight: 400, textTransform: 'none' }}>(Select all that apply)</span>
                </label>

                <div style={styles.chipGrid}>
                  {facilityOptions.map((facility) => {
                    const isSelected = pricingFacilitiesData.facilities.includes(facility.name);
                    return (
                      <div
                        key={facility.name}
                        onClick={() => toggleFacility(facility.name)}
                        style={{
                          ...styles.chipItem,
                          backgroundColor: isSelected ? themeStyles.chipSelectedBg : themeStyles.inputBg,
                          borderColor: isSelected ? themeStyles.chipSelectedBorder : themeStyles.inputBorder,
                          color: isSelected ? themeStyles.chipSelectedText : themeStyles.textColor,
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{facility.icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500 }}>{facility.name}</span>
                        {isSelected && <CheckCircle2 size={16} color="#c8895b" style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ground Images (Min 3 required) */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...styles.formLabel, color: themeStyles.textMuted }}>
                  Ground Images <span style={{ fontWeight: 400, textTransform: 'none' }}>(Min 3 required)</span>
                </label>

                <div style={styles.imageGrid}>
                  {pricingFacilitiesData.groundImages.map((img, idx) => (
                    <div key={idx} style={styles.imageThumbnailCard}>
                      <img src={img} alt={`Ground ${idx + 1}`} style={styles.thumbnailImg} />
                      <button
                        type="button"
                        style={styles.deleteImgBtn}
                        onClick={() => handleRemoveGroundImage(idx)}
                        title="Remove Image"
                      >
                        <X size={14} color="#FFFFFF" />
                      </button>
                    </div>
                  ))}

                  {/* Add More Box */}
                  <label
                    htmlFor="ground-img-upload"
                    style={{
                      ...styles.addImgBox,
                      borderColor: '#c8895b',
                      backgroundColor: 'rgba(200, 137, 91, 0.08)',
                    }}
                  >
                    <Plus size={22} color="#c8895b" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c8895b' }}>
                      Add More
                    </span>
                  </label>
                  <input
                    id="ground-img-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAddGroundImage}
                    style={{ display: 'none' }}
                  />
                </div>
                {errors.groundImages && <span style={styles.errorText}>{errors.groundImages}</span>}
              </div>

              {/* Bottom Submit Action */}
              <div style={{ marginTop: '1.75rem' }}>
                <button
                  style={{
                    ...styles.fullBtn,
                    background: themeStyles.primaryBtn,
                    boxShadow: themeStyles.primaryBtnShadow,
                  }}
                  onClick={handleSubmitForm}
                >
                  <span>Submit for Review</span>
                  <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REGISTRATION SUBMITTED (SUCCESS VIEW) */}
          {step === 4 && (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    ...styles.successBadgeCircle,
                    backgroundColor: '#c8895b',
                    boxShadow: '0 0 35px rgba(200, 137, 91, 0.4)',
                  }}
                >
                  <Check size={42} color="#FFFFFF" strokeWidth={3.5} />
                </div>
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: themeStyles.textColor, marginBottom: '0.35rem' }}>
                Registration Submitted!
              </h2>
              <p style={{ fontSize: '0.95rem', color: themeStyles.textMuted, marginBottom: '1.5rem' }}>
                Thank you for registering with <strong style={{ color: '#c8895b' }}>SportVerse AI</strong>.
              </p>

              {/* Ground Graphic Card */}
              <div
                style={{
                  ...styles.successCard,
                  backgroundColor: themeStyles.inputBg,
                  borderColor: themeStyles.inputBorder,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={pricingFacilitiesData.groundImages[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'}
                    alt="Ground Preview"
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(200, 137, 91, 0.2)',
                        color: '#e5ba93',
                        border: '1px solid rgba(200, 137, 91, 0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      ⏳ Under Review
                    </span>
                  </div>
                </div>

                <div style={{ padding: '1rem', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: themeStyles.textColor, marginBottom: '0.2rem' }}>
                    {groundData.groundName || 'SportVerse Turf & Court'}
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: themeStyles.textMuted, marginBottom: '0.75rem' }}>
                    {locationData.address || 'Sports Complex'}, {locationData.city || 'Kozhikode'}
                  </p>

                  <p style={{ fontSize: '0.85rem', color: themeStyles.textColor, lineHeight: 1.5 }}>
                    Your registration has been submitted successfully. Our team will review your details and documents.
                  </p>
                  <p style={{ fontSize: '0.825rem', color: themeStyles.textMuted, marginTop: '0.4rem' }}>
                    We will notify you once your ground is approved.
                  </p>
                </div>
              </div>

              {/* Go to Dashboard Button */}
              <div style={{ marginTop: '1.75rem' }}>
                <button
                  style={{
                    ...styles.fullBtn,
                    background: themeStyles.primaryBtn,
                    boxShadow: themeStyles.primaryBtnShadow,
                  }}
                  onClick={onClose}
                >
                  <span>Go to Dashboard</span>
                  <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContainer: {
    width: '100%',
    maxWidth: '540px',
    borderRadius: '24px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '92vh',
    border: '1px solid rgba(200, 137, 91, 0.28)',
  },
  headerBar: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: 'rgba(200, 137, 91, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: 800,
    margin: 0,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
  },
  stepperContainer: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  stepperTrack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
    cursor: 'pointer',
  },
  stepCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.775rem',
    fontWeight: 700,
    transition: 'all 0.25s ease',
  },
  stepLabel: {
    fontSize: '0.75rem',
    textAlign: 'center',
  },
  stepLine: {
    flex: 1,
    height: '2px',
    margin: '0 0.4rem 1rem 0.4rem',
    transition: 'all 0.25s ease',
  },
  modalBody: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    marginBottom: '0.35rem',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
  },
  styledInput: {
    width: '100%',
    height: '44px',
    padding: '0 1rem 0 2.5rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  styledTextarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
  },
  charCounter: {
    position: 'absolute',
    bottom: '8px',
    right: '12px',
    fontSize: '0.725rem',
  },
  chipGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.65rem',
  },
  chipItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.65rem 0.85rem',
    borderRadius: '12px',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  mapMockup: {
    height: '140px',
    borderRadius: '14px',
    border: '1px solid',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGridPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'radial-gradient(circle, rgba(200, 137, 91, 0.2) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    opacity: 0.6,
  },
  mapPinContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
  },
  animatedPin: {
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
  },
  mapPinPulse: {
    width: '18px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    marginTop: '-4px',
  },
  mapOverlayPill: {
    position: 'absolute',
    bottom: '10px',
    left: '12px',
    padding: '0.3rem 0.65rem',
    borderRadius: '9999px',
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#FFFFFF',
    fontSize: '0.725rem',
    fontWeight: 600,
    backdropFilter: 'blur(4px)',
  },
  mapActionBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.55rem 0.75rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '14px',
    fontSize: '1.1rem',
    fontWeight: 800,
  },
  styledSelect: {
    width: '100%',
    height: '44px',
    padding: '0 1rem 0 2.5rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.875rem',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.65rem',
  },
  imageThumbnailCard: {
    position: 'relative',
    height: '80px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.1)',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  deleteImgBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  addImgBox: {
    height: '80px',
    borderRadius: '10px',
    border: '2px dashed',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.2rem',
    cursor: 'pointer',
  },
  fullBtn: {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    border: 'none',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  errorText: {
    fontSize: '0.75rem',
    color: '#EF4444',
    marginTop: '0.25rem',
    display: 'block',
    fontWeight: 500,
  },
  successBadgeCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    borderRadius: '16px',
    border: '1px solid',
    overflow: 'hidden',
    marginTop: '1rem',
  },
};
