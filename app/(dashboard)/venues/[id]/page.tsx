"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, MapPin, Trash2, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

type Venue = {
  id: string
  name: string
  address: string
  capacity: number
  facilities: string[]
  contactInfo: string
  description: string
}

type Event = {
  id: string
  title: string
  date: string
  time: string
}

export default function VenueDetailsPage() {
  const { token, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const venueId = params.id as string

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        const response = await fetch(`/api/venue/${venueId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch venue details")
        }

        const data = await response.json()
        setVenue(data)

        // Fetch upcoming events at this venue
        const eventsResponse = await fetch(`/api/event?venue=${venueId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setUpcomingEvents(eventsData)
        }
      } catch (error) {
        console.error("Error fetching venue details:", error)
        setError("Failed to load venue details. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVenueDetails()
  }, [venueId, token])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/venue/${venueId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete venue")
      }

      toast({
        title: "Venue deleted",
        description: "The venue has been successfully deleted",
      })
      router.push("/venues")
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const canEdit = user?.role === "admin" || user?.role === "manager"

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button asChild>
          <Link href="/venues">Back to Venues</Link>
        </Button>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl font-medium mb-4">Venue not found</p>
        <Button asChild>
          <Link href="/venues">Back to Venues</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{venue.name}</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{venue.address}</span>
          </div>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link href={`/venues/${venueId}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the venue and may affect any events
                    scheduled at this location.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Venue Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground mt-1">{venue.description}</p>
            </div>
            <div>
              <h3 className="font-medium">Capacity</h3>
              <div className="flex items-center mt-1">
                <Users className="mr-2 h-4 w-4 opacity-70" />
                <span>{venue.capacity} people</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium">Facilities</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {venue.facilities.map((facility) => (
                  <Badge key={facility} variant="outline">
                    {facility}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium">Contact Information</h3>
              <p className="text-muted-foreground mt-1">{venue.contactInfo}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events scheduled at this venue</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground">No upcoming events scheduled at this venue.</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/events/${event.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

