"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export default function CreateVenuePage() {
  const { token } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    capacity: "",
    description: "",
    contactInfo: "",
  })
  const [facility, setFacility] = useState("")
  const [facilities, setFacilities] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddFacility = (e: React.FormEvent) => {
    e.preventDefault()
    if (facility.trim() && !facilities.includes(facility.trim())) {
      setFacilities((prev) => [...prev, facility.trim()])
      setFacility("")
    }
  }

  const handleRemoveFacility = (facilityToRemove: string) => {
    setFacilities((prev) => prev.filter((facility) => facility !== facilityToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/venue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number.parseInt(formData.capacity),
          facilities,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create venue")
      }

      const data = await response.json()
      toast({
        title: "Venue created",
        description: "Your venue has been created successfully",
      })
      router.push(`/venues/${data.id}`)
    } catch (error) {
      toast({
        title: "Error creating venue",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add Venue</h1>
        <p className="text-muted-foreground">Fill in the details to add a new venue</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Venue Details</CardTitle>
            <CardDescription>Provide the basic information about the venue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter venue name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter venue address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the venue"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Maximum number of people"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Information</Label>
              <Input
                id="contactInfo"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleChange}
                placeholder="Phone number, email, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Facilities</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {facilities.map((facility) => (
                  <Badge key={facility} variant="secondary" className="gap-1">
                    {facility}
                    <button
                      type="button"
                      onClick={() => handleRemoveFacility(facility)}
                      className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {facility}</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="Add facility (e.g., WiFi, Projector)"
                />
                <Button type="button" variant="outline" onClick={handleAddFacility}>
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/venues">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Venue"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

