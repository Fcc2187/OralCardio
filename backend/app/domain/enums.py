from enum import StrEnum


class BrushingZone(StrEnum):
    UPPER_RIGHT = "upper_right"
    UPPER_LEFT = "upper_left"
    LOWER_RIGHT = "lower_right"
    LOWER_LEFT = "lower_left"
    TONGUE = "tongue"


class CardiacCondition(StrEnum):
    VALVE_DISEASE = "valve_disease"
    CONGENITAL_HEART = "congenital_heart"
    HEART_FAILURE = "heart_failure"
    ARRHYTHMIA = "arrhythmia"
    CORONARY_ARTERY = "coronary_artery"
    ENDOCARDITIS_HISTORY = "endocarditis_history"
    OTHER = "other"


class EducationCategory(StrEnum):
    MOUTH_HEART_CONNECTION = "mouth_heart_connection"
    BACTEREMIA = "bacteremia"
    ENDOCARDITIS = "endocarditis"
    GINGIVITIS = "gingivitis"
    ORAL_HYGIENE_TECHNIQUES = "oral_hygiene_techniques"
    MEDICATION_INTERACTIONS = "medication_interactions"


class AchievementConditionType(StrEnum):
    BRUSHING_COUNT = "brushing_count"
    STREAK_DAYS = "streak_days"
    MODULE_COMPLETED = "module_completed"
    ALL_MODULES_COMPLETED = "all_modules_completed"
    APPOINTMENT_SCHEDULED = "appointment_scheduled"
    HEALTH_PROFILE_COMPLETED = "health_profile_completed"
    FLOSSING_COUNT = "flossing_count"


class AppointmentType(StrEnum):
    ROUTINE_CHECKUP = "routine_checkup"
    CLEANING = "cleaning"
    EMERGENCY = "emergency"
    FOLLOW_UP = "follow_up"
    PROCEDURE = "procedure"


class AppointmentStatus(StrEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class CaregiverStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    REVOKED = "revoked"
