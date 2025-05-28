"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, HelpCircle, Info, X } from "lucide-react"
import { useRouter } from "next/navigation"

// Define tier thresholds and costs
const TIERS = [
  { name: "Tier 1", min: 0, max: 19, cost: 10, maxReward: "₹20" },
  { name: "Tier 2", min: 20, max: 29, cost: 20, maxReward: "₹30" },
  { name: "Tier 3", min: 30, max: 39, cost: 30, maxReward: "₹40" },
  { name: "Tier 4", min: 40, max: 59, cost: 40, maxReward: "₹50" },
  { name: "Tier 5", min: 60, max: 99, cost: 60, maxReward: "₹100" },
  { name: "Premium", min: 100, max: Number.POSITIVE_INFINITY, cost: 100, maxReward: "₹250" },
]

// Add this function to determine wheel segments based on points:
const getWheelSegments = (totalPoints: number) => {
  // Define colors for different reward amounts
  const colors = {
    "₹10": "#FFD166",
    "₹20": "#4ECDC4",
    "₹30": "#2EC4B6",
    "₹40": "#6A0572",
    "₹50": "#FF6B6B",
    "₹100": "#F72585",
    "₹250": "#E76F51",
  }

  let segments = []
  let id = 1

  // Determine reward probabilities based on point tiers
  if (totalPoints < 20) {
    segments = [
      { id: id++, reward: "₹10", color: colors["₹10"], probability: 90 },
      { id: id++, reward: "₹20", color: colors["₹20"], probability: 10 },
    ]
  } else if (totalPoints < 30) {
    segments = [
      { id: id++, reward: "₹10", color: colors["₹10"], probability: 50 },
      { id: id++, reward: "₹20", color: colors["₹20"], probability: 40 },
      { id: id++, reward: "₹30", color: colors["₹30"], probability: 10 },
    ]
  } else if (totalPoints < 40) {
    segments = [
      { id: id++, reward: "₹10", color: colors["₹10"], probability: 40 },
      { id: id++, reward: "₹20", color: colors["₹20"], probability: 30 },
      { id: id++, reward: "₹30", color: colors["₹30"], probability: 20 },
      { id: id++, reward: "₹40", color: colors["₹40"], probability: 10 },
    ]
  } else if (totalPoints < 60) {
    segments = [
      { id: id++, reward: "₹10", color: colors["₹10"], probability: 25 },
      { id: id++, reward: "₹20", color: colors["₹20"], probability: 25 },
      { id: id++, reward: "₹30", color: colors["₹30"], probability: 20 },
      { id: id++, reward: "₹40", color: colors["₹40"], probability: 10 },
      { id: id++, reward: "₹50", color: colors["₹50"], probability: 10 },
    ]
  } else if (totalPoints < 100) {
    segments = [
      { id: id++, reward: "₹10", color: colors["₹10"], probability: 5 },
      { id: id++, reward: "₹20", color: colors["₹20"], probability: 15 },
      { id: id++, reward: "₹30", color: colors["₹30"], probability: 15 },
      { id: id++, reward: "₹40", color: colors["₹40"], probability: 15 },
      { id: id++, reward: "₹50", color: colors["₹50"], probability: 25 },
      { id: id++, reward: "₹100", color: colors["₹100"], probability: 25 },
    ]
  } else {
    segments = [
      { id: id++, reward: "₹30", color: colors["₹30"], probability: 5 },
      { id: id++, reward: "₹40", color: colors["₹40"], probability: 15 },
      { id: id++, reward: "₹50", color: colors["₹50"], probability: 20 },
      { id: id++, reward: "₹100", color: colors["₹100"], probability: 50 },
      { id: id++, reward: "₹250", color: colors["₹250"], probability: 5 },
    ]
  }

  return segments
}

// Helper function to get current tier based on points
const getCurrentTier = (points: number) => {
  return TIERS.find((tier) => points >= tier.min && points <= tier.max) || TIERS[0]
}

// Helper function to get next tier based on points
const getNextTier = (points: number) => {
  const currentTierIndex = TIERS.findIndex((tier) => points >= tier.min && points <= tier.max)
  return currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null
}

// Helper function to render a mini wheel for a tier
const renderMiniWheel = (tier: number) => {
  const segments = getWheelSegments(
    tier === 1 ? 10 : tier === 2 ? 25 : tier === 3 ? 35 : tier === 4 ? 50 : tier === 5 ? 80 : 120,
  )

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {segments.map((segment, index) => {
        const angle = 360 / segments.length
        const startAngle = index * angle
        const endAngle = (index + 1) * angle

        // Calculate SVG arc path
        const startRad = (startAngle - 90) * (Math.PI / 180)
        const endRad = (endAngle - 90) * (Math.PI / 180)

        const x1 = 50 + 50 * Math.cos(startRad)
        const y1 = 50 + 50 * Math.sin(startRad)
        const x2 = 50 + 50 * Math.cos(endRad)
        const y2 = 50 + 50 * Math.sin(endRad)

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

        // Path for the segment
        const d = [`M 50 50`, `L ${x1} ${y1}`, `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

        return <path key={index} d={d} fill={segment.color} stroke="#fff" strokeWidth="0.5" />
      })}
    </svg>
  )
}

export default function SpinWheel() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<null | { reward: string; color: string }>(null)
  const [showResult, setShowResult] = useState(false)
  const [availablePoints, setAvailablePoints] = useState(35) // Mock data
  const [totalPoints, setTotalPoints] = useState(35) // Total points in wallet
  const [wheelSegments, setWheelSegments] = useState(getWheelSegments(35))
  const [showTierModal, setShowTierModal] = useState(false)
  const [showWheelPreview, setShowWheelPreview] = useState(false)
  const [showTipsModal, setShowTipsModal] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const spinDuration = 5000 // 5 seconds spin
  const spinRevolutions = 5 // Number of full revolutions before landing

  // Get current and next tier
  const currentTier = getCurrentTier(totalPoints)
  const nextTier = getNextTier(totalPoints)
  const spinCost = currentTier.cost

  useEffect(() => {
    setIsLoaded(true)
    // Update wheel segments when total points change
    setWheelSegments(getWheelSegments(totalPoints))
  }, [totalPoints])

  const handleBack = () => {
    router.push("/dashboard")
  }

  const spinWheel = () => {
    if (isSpinning || availablePoints < spinCost) return

    setIsSpinning(true)
    setShowResult(false)
    setSpinResult(null)

    // Deduct points immediately
    setAvailablePoints((prev) => prev - spinCost)

    // Get the current wheel segments based on total points
    const currentWheelSegments = getWheelSegments(totalPoints)

    // Calculate a weighted random segment based on probability
    const totalProbability = currentWheelSegments.reduce((sum, segment) => sum + segment.probability, 0)
    let random = Math.random() * totalProbability
    let selectedSegment = currentWheelSegments[0]

    for (const segment of currentWheelSegments) {
      if (random < segment.probability) {
        selectedSegment = segment
        break
      }
      random -= segment.probability
    }

    // Calculate the rotation angle to land on the selected segment
    const segmentAngle = 360 / currentWheelSegments.length
    const segmentIndex = currentWheelSegments.findIndex((s) => s.id === selectedSegment.id)
    const baseAngle = segmentIndex * segmentAngle

    // Add randomness within the segment
    const randomOffset = Math.random() * segmentAngle

    // Calculate final rotation (multiple revolutions + segment angle)
    const finalRotation = spinRevolutions * 360 + (360 - (baseAngle + randomOffset))

    // Apply the rotation to the wheel
    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${spinDuration / 1000}s cubic-bezier(0.1, 0.7, 0.1, 1)`
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`
    }

    // After spinning completes, show the result
    setTimeout(() => {
      setSpinResult({
        reward: selectedSegment.reward,
        color: selectedSegment.color,
      })
      setIsSpinning(false)
      setShowResult(true)
    }, spinDuration)
  }

  const handleSpinAgain = () => {
    if (availablePoints >= spinCost) {
      // Reset wheel position with no transition
      if (wheelRef.current) {
        wheelRef.current.style.transition = "none"
        wheelRef.current.style.transform = "rotate(0deg)"
      }

      // Force a reflow to ensure the transition is reset
      if (wheelRef.current) {
        void wheelRef.current.offsetWidth
      }

      setShowResult(false)
      setTimeout(() => {
        spinWheel()
      }, 100)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
      <div className="w-full max-w-md mx-auto h-full flex flex-col relative">
        {/* Header */}
        <div
          className="w-full text-white py-6 px-6 rounded-3xl z-0 mt-4"
          style={{
            background: "linear-gradient(135deg, #4A2B6B 0%, #4A2B6B 85%, #F7E7CE 150%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            height: "20vh",
            minHeight: "120px",
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 h-10 w-10 rounded-full text-white"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold text-center font-serif">Spin & Win</h1>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 h-10 w-10 rounded-full text-white"
            onClick={() => setShowTipsModal(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Content container */}
        <div
          className="flex-1 px-6 py-6 flex flex-col rounded-3xl relative z-10"
          style={{
            backgroundColor: "#FFFAF2", // Lighter than champagne_lite
            boxShadow: "0 8px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
            marginTop: "-5%",
          }}
        >
          {/* Points Card */}
          <Card className="w-full mb-6 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-gray-500 text-sm">Available Points</p>
                  <p className="text-2xl font-bold text-[#0C1621]">{availablePoints} pts</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Wallet Points</p>
                  <p className="text-2xl font-bold text-[#0C1621]">{totalPoints} pts</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm">Spin Cost</p>
                  <p className="text-xl font-bold text-[#0C1621]">{spinCost} pts</p>
                </div>
                <div className="flex items-center">
                  <p className="text-gray-500 text-sm mr-2">Reward Tier</p>
                  <div
                    className="text-sm font-medium px-2 py-1 bg-[#7E5BEF]/20 text-[#7E5BEF] rounded-full flex items-center"
                    onClick={() => setShowTierModal(true)}
                  >
                    {currentTier.name}
                    <Info className="h-4 w-4 ml-1 cursor-pointer" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Explanation Card */}
          <Card className="w-full mb-4 sm:mb-6 overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <h3 className="font-bold text-base sm:text-lg">Your Reward Tier</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-[#7E5BEF] px-2 sm:px-3"
                  onClick={() => setShowWheelPreview(true)}
                >
                  See All Tiers
                </Button>
              </div>

              {/* Current Tier Info */}
              <div className="mb-4">
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-[#7E5BEF] mr-2"></div>
                  <p className="font-medium">Current: {currentTier.name}</p>
                </div>
                <div className="pl-5 text-sm text-gray-600 mb-2">
                  <p>• Spin Cost: {currentTier.cost} points</p>
                  <p>• Max Potential: {currentTier.maxReward}</p>
                </div>
                <div className="pl-5 text-sm">
                  <p className="font-medium mb-1">Rewards:</p>
                  <div className="flex flex-wrap gap-1">
                    {wheelSegments.map((segment) => (
                      <span
                        key={segment.id}
                        className="px-2 py-0.5 rounded-full text-xs text-white"
                        style={{ backgroundColor: segment.color }}
                      >
                        {segment.reward} ({segment.probability}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Tier Info (if available) */}
              {nextTier && (
                <>
                  <div className="w-full h-px bg-gray-200 my-3"></div>

                  <div>
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                      <p className="font-medium">Next: {nextTier.name}</p>
                    </div>
                    <div className="pl-5 text-sm text-gray-600 mb-2">
                      <p>• Spin Cost: {nextTier.cost} points</p>
                      <p>• Max Potential: {nextTier.maxReward}</p>
                    </div>

                    {/* Progress to next tier */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{totalPoints} pts</span>
                        <span>{nextTier.min} pts</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7E5BEF]"
                          style={{
                            width: `${Math.min(
                              ((totalPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100,
                              100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-center text-sm mt-2 font-medium text-[#7E5BEF]">
                        Need {nextTier.min - totalPoints} more points for {nextTier.name}!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Spin Wheel Container */}
          <div className="relative w-full max-w-md aspect-square mb-8">
            {/* Wheel */}
            <div className="relative w-full h-full">
              {/* Wheel segments */}
              <div
                ref={wheelRef}
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{ transformOrigin: "center center" }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {wheelSegments.map((segment, index) => {
                    const angle = 360 / wheelSegments.length
                    const startAngle = index * angle
                    const endAngle = (index + 1) * angle

                    // Calculate SVG arc path
                    const startRad = (startAngle - 90) * (Math.PI / 180)
                    const endRad = (endAngle - 90) * (Math.PI / 180)

                    const x1 = 50 + 50 * Math.cos(startRad)
                    const y1 = 50 + 50 * Math.sin(startRad)
                    const x2 = 50 + 50 * Math.cos(endRad)
                    const y2 = 50 + 50 * Math.sin(endRad)

                    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

                    // Path for the segment
                    const d = [`M 50 50`, `L ${x1} ${y1}`, `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

                    // Text position
                    const textRad = (startAngle + angle / 2 - 90) * (Math.PI / 180)
                    const textX = 50 + 35 * Math.cos(textRad)
                    const textY = 50 + 35 * Math.sin(textRad)
                    const textRotation = startAngle + angle / 2

                    return (
                      <g key={segment.id}>
                        <path d={d} fill={segment.color} stroke="#fff" strokeWidth="0.5" />
                        <text
                          x={textX}
                          y={textY}
                          fill="white"
                          fontSize="6"
                          fontWeight="bold"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                        >
                          {segment.reward}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Center of wheel */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
                  <div className="w-8 h-8 rounded-full bg-[#7E5BEF]"></div>
                </div>
              </div>

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 bg-[#7E5BEF] transform rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Spin Button or Result */}
          {showResult ? (
            <div className={`w-full max-w-md animate-fade-in-up`}>
              <Card className="overflow-hidden mb-6">
                <CardContent className="p-6 flex flex-col items-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${spinResult?.color}20` }}
                  >
                    <span className="text-3xl font-bold" style={{ color: spinResult?.color }}>
                      {spinResult?.reward}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
                  <p className="text-center text-gray-600 mb-6">You won {spinResult?.reward} in cashback rewards!</p>
                  <div className="flex gap-4 w-full">
                    <Button variant="outline" className="flex-1 h-12 rounded-full" onClick={handleBack}>
                      Back to Home
                    </Button>
                    <Button
                      className={`flex-1 h-12 rounded-full ${
                        availablePoints >= spinCost
                          ? "bg-[#7E5BEF] hover:bg-[#6D4AD8]"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      disabled={availablePoints < spinCost}
                      onClick={handleSpinAgain}
                    >
                      Spin Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Button
              className={`w-full max-w-md h-14 rounded-full text-lg font-bold transition-all duration-300 ${
                isSpinning || availablePoints < spinCost
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#7E5BEF] hover:bg-[#6D4AD8] animate-subtle-pulse"
              }`}
              disabled={isSpinning || availablePoints < spinCost}
              onClick={spinWheel}
            >
              {isSpinning ? "Spinning..." : "Spin the Wheel"}
            </Button>
          )}

          {/* Rules Card */}
          <Card className={`w-full max-w-md mt-6 overflow-hidden`}>
            <CardContent className="p-4">
              <h3 className="font-bold mb-2">How it works</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Each spin costs points based on your tier</li>
                <li>• Your reward tier is based on your total wallet points</li>
                <li>• Higher tiers unlock better rewards (up to ₹250)</li>
                <li>• Rewards are added directly to your wallet</li>
                <li>• Submit more feedback to level up your tier!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tier Benefits Modal */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <Card className="w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Reward Tier Benefits</h2>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setShowTierModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {TIERS.map((tier, index) => (
                <div key={index} className="mb-6">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        tier.min <= totalPoints && tier.max >= totalPoints ? "bg-[#7E5BEF]" : "bg-gray-300"
                      }`}
                    ></div>
                    <h3 className="font-bold">
                      {tier.name} ({tier.min === 0 ? "<" : ""}
                      {tier.min === 0 ? tier.max + 1 : tier.min}-
                      {tier.max === Number.POSITIVE_INFINITY ? "+" : tier.max} points)
                      {tier.min <= totalPoints && tier.max >= totalPoints && " ← YOU ARE HERE"}
                    </h3>
                  </div>
                  <div className="pl-5 mt-2">
                    <p className="text-sm">• Spin Cost: {tier.cost} points</p>
                    <p className="text-sm">• Max Potential: {tier.maxReward}</p>
                    <p className="text-sm mb-2">• Rewards:</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {getWheelSegments(
                        tier.name === "Tier 1"
                          ? 10
                          : tier.name === "Tier 2"
                            ? 25
                            : tier.name === "Tier 3"
                              ? 35
                              : tier.name === "Tier 4"
                                ? 50
                                : tier.name === "Tier 5"
                                  ? 80
                                  : 120,
                      ).map((segment, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-xs text-white"
                          style={{ backgroundColor: segment.color }}
                        >
                          {segment.reward} ({segment.probability}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Submit more feedback to increase your points and unlock higher tiers with better rewards!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wheel Preview Modal */}
      {showWheelPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <Card className="w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Wheel Tiers Preview</h2>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setShowWheelPreview(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TIERS.map((tier, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-full aspect-square rounded-full overflow-hidden border-4 ${
                        tier.min <= totalPoints && tier.max >= totalPoints ? "border-[#7E5BEF]" : "border-gray-200"
                      }`}
                    >
                      {renderMiniWheel(index + 1)}
                    </div>
                    <p className="font-medium mt-2">{tier.name}</p>
                    <p className="text-xs">Max: {tier.maxReward}</p>
                    <p className="text-xs">Cost: {tier.cost} pts</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="font-medium">Your current tier: {currentTier.name}</p>
                {nextTier && (
                  <p className="text-sm text-[#7E5BEF] mt-1">
                    Need {nextTier.min - totalPoints} more points for {nextTier.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Tips Modal */}
      {showTipsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Maximize Your Feedback Quality</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowTipsModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <p className="font-medium mb-3">Tips for earning maximum points:</p>

              <ul className="space-y-3">
                <li className="flex">
                  <div className="w-6 h-6 rounded-full bg-[#7E5BEF]/20 text-[#7E5BEF] flex items-center justify-center mr-2 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Record a full 30-second video</p>
                    <p className="text-sm text-gray-600">Show the garment from multiple angles</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="w-6 h-6 rounded-full bg-[#7E5BEF]/20 text-[#7E5BEF] flex items-center justify-center mr-2 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Show multiple angles of the outfit</p>
                    <p className="text-sm text-gray-600">Front, back, and sides</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="w-6 h-6 rounded-full bg-[#7E5BEF]/20 text-[#7E5BEF] flex items-center justify-center mr-2 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Talk in detail about fit on different body parts</p>
                    <p className="text-sm text-gray-600">Shoulders, chest, waist, hips, etc.</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="w-6 h-6 rounded-full bg-[#7E5BEF]/20 text-[#7E5BEF] flex items-center justify-center mr-2 flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Describe fabric feel, stretch, comfort, and breathability</p>
                    <p className="text-sm text-gray-600">Be specific about material quality</p>
                  </div>
                </li>

                <li className="flex">
                  <div className="w-6 h-6 rounded-full bg-[#7E5BEF]/20 text-[#7E5BEF] flex items-center justify-center mr-2 flex-shrink-0">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Mention if sizing runs large/small</p>
                    <p className="text-sm text-gray-600">Compare to your usual size</p>
                  </div>
                </li>
              </ul>

              <div className="mt-6 p-3 bg-[#7E5BEF]/10 rounded-lg">
                <p className="font-medium text-center text-[#7E5BEF]">
                  High-quality feedback helps other shoppers make better decisions!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
