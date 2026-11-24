export const exercises={
  "Knee bend": {
    "area": "Legs",
    "level": "Gentle",
    "equipment": "Chair",
    "view": "Side view",
    "desc": "A seated bend and return for the knee.",
    "name": "Knee bend",
    "id": "knee-bend",
    "base": "Knee bend",
    "joints": [
      23,
      25,
      27
    ],
    "tracking": "camera",
    "start": 150,
    "end": 115,
    "raised": false,
    "instructions": [
      "Sit side-on on a stable chair with your thigh supported.",
      "Extend the knee comfortably.",
      "Bend the knee, bringing your foot under the chair.",
      "Return to the extended position."
    ],
    "muscles": "Thigh and lower-leg muscles",
    "mistakes": "Thigh lifting off its supported position",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Elbow curl": {
    "area": "Arms",
    "level": "Gentle",
    "equipment": "None",
    "view": "Side view",
    "desc": "A controlled forearm curl with a steady upper arm.",
    "name": "Elbow curl",
    "id": "elbow-curl",
    "base": "Elbow curl",
    "joints": [
      11,
      13,
      15
    ],
    "tracking": "camera",
    "start": 150,
    "end": 115,
    "raised": false,
    "instructions": [
      "Stand side-on with your upper arm beside your ribs.",
      "Open your elbow comfortably.",
      "Curl your forearm without swinging your upper arm.",
      "Lower your forearm slowly."
    ],
    "muscles": "Elbow flexors",
    "mistakes": "Upper arm moving away from the torso",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Arm raise": {
    "area": "Shoulders",
    "level": "Gentle",
    "equipment": "None",
    "view": "Front view",
    "desc": "Lift your arm out to the side and lower slowly.",
    "name": "Arm raise",
    "id": "arm-raise",
    "base": "Arm raise",
    "joints": [
      23,
      11,
      15
    ],
    "tracking": "camera",
    "start": 30,
    "end": 70,
    "raised": true,
    "instructions": [
      "Face the camera, arm beside you.",
      "Keep a comfortable straight elbow.",
      "Lift the arm to the side toward shoulder height.",
      "Lower back beside you."
    ],
    "muscles": "Shoulder muscles",
    "mistakes": "Elbow bending during the raise",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Bodyweight squat": {
    "area": "Legs",
    "level": "Coordinated",
    "equipment": "None",
    "view": "Side view",
    "desc": "Bend hips and knees together, then stand.",
    "name": "Bodyweight squat",
    "id": "bodyweight-squat",
    "base": "Bodyweight squat",
    "joints": [
      11,
      23,
      25,
      27
    ],
    "tracking": "camera",
    "start": 150,
    "end": 115,
    "raised": false,
    "instructions": [
      "Stand side-on with both feet planted.",
      "Start tall with knees and hips open.",
      "Send hips back as your knees bend within a comfortable range.",
      "Return to standing."
    ],
    "muscles": "Thigh and lower-leg muscles",
    "mistakes": "Knees bending without sufficient hip bend",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Hip hinge": {
    "area": "Hips",
    "level": "Coordinated",
    "equipment": "None",
    "view": "Side view",
    "desc": "Move from the hips with a soft knee bend.",
    "name": "Hip hinge",
    "id": "hip-hinge",
    "base": "Hip hinge",
    "joints": [
      11,
      23,
      25,
      27
    ],
    "tracking": "camera",
    "start": 150,
    "end": 115,
    "raised": false,
    "instructions": [
      "Stand side-on with knees softly bent.",
      "Start upright with your feet planted.",
      "Send hips back and tip forward from the hips.",
      "Return upright without locking your knees."
    ],
    "muscles": "Hip and posterior-chain muscles",
    "mistakes": "Deep knee bend during the hinge",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Hammer curl": {
    "area": "Arms",
    "level": "Gentle",
    "equipment": "None",
    "view": "Side view",
    "desc": "Curl with your thumb up and upper arm steady.",
    "name": "Hammer curl",
    "id": "hammer-curl",
    "base": "Elbow curl",
    "joints": [
      11,
      13,
      15
    ],
    "tracking": "camera",
    "start": 150,
    "end": 115,
    "raised": false,
    "instructions": [
      "Stand side-on, thumb up and upper arm beside your ribs.",
      "Open the elbow.",
      "Curl the forearm while keeping the upper arm steady.",
      "Lower slowly."
    ],
    "muscles": "Elbow flexors",
    "mistakes": "Upper arm moving away from the torso",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Front raise": {
    "area": "Shoulders",
    "level": "Gentle",
    "equipment": "None",
    "view": "Side view",
    "desc": "Lift your arm forward, then return beside you.",
    "name": "Front raise",
    "id": "front-raise",
    "base": "Arm raise",
    "joints": [
      23,
      11,
      15
    ],
    "tracking": "camera",
    "start": 30,
    "end": 70,
    "raised": true,
    "instructions": [
      "Stand side-on with a straight arm beside you.",
      "Keep your elbow comfortably straight.",
      "Lift forward toward shoulder height.",
      "Lower slowly."
    ],
    "muscles": "Shoulder muscles",
    "mistakes": "Elbow bending during the raise",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Mini squat": {
    "area": "Legs",
    "level": "Gentle",
    "equipment": "None",
    "view": "Side view",
    "desc": "Practice a shallow squat within a comfortable range.",
    "name": "Mini squat",
    "id": "mini-squat",
    "base": "Bodyweight squat",
    "joints": [
      11,
      23,
      25,
      27
    ],
    "tracking": "camera",
    "start": 150,
    "end": 140,
    "raised": false,
    "instructions": [
      "Stand side-on with feet planted.",
      "Begin standing tall.",
      "Send hips back into a shallow knee bend.",
      "Stand up slowly."
    ],
    "muscles": "Thigh and lower-leg muscles",
    "mistakes": "Knees bending without sufficient hip bend",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Standing hamstring curl": {
    "area": "Legs",
    "level": "Gentle",
    "equipment": "Stable support",
    "view": "Side view",
    "desc": "Bring your heel behind you with your thigh upright.",
    "name": "Standing hamstring curl",
    "id": "standing-hamstring-curl",
    "base": "Knee bend",
    "joints": [
      23,
      25,
      27
    ],
    "tracking": "camera",
    "start": 150,
    "end": 115,
    "raised": false,
    "instructions": [
      "Stand side-on beside a stable support.",
      "Keep your thigh vertical and knee comfortably open.",
      "Bend the knee to bring your heel behind you.",
      "Lower your foot slowly."
    ],
    "muscles": "Thigh and lower-leg muscles",
    "mistakes": "Thigh tilting away from vertical",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  },
  "Good morning": {
    "area": "Hips",
    "level": "Coordinated",
    "equipment": "None",
    "view": "Side view",
    "desc": "Hinge forward from your hips and return upright.",
    "name": "Good morning",
    "id": "good-morning",
    "base": "Hip hinge",
    "joints": [
      11,
      23,
      25,
      27
    ],
    "tracking": "camera",
    "start": 150,
    "end": 115,
    "raised": false,
    "instructions": [
      "Stand side-on with hands on your chest, knees softly bent.",
      "Start upright.",
      "Push hips back and tip your torso from your hips.",
      "Return upright."
    ],
    "muscles": "Hip and posterior-chain muscles",
    "mistakes": "Deep knee bend during the hinge",
    "limits": "Projected 2D angles only. Grip, spinal alignment, load and balance are not verified."
  }
};
export const exerciseList=Object.values(exercises);
export const baseExercise=name=>exercises[name]?.base||name;
