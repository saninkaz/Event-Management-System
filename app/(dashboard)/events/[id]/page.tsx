"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Edit, MapPin, Trash2, User, Users, MessageSquare, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Event = {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  type: string
  organizer: {
    id: string
    name: string
  }
  capacity: number
  attendees: number
  isRegistered: boolean
}

export default function EventDetailsPage() {
  const { token, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const eventId = params.id as string

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/event/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch event details")
        }

        const data = await response.json()
        setEvent(data)
      } catch (error) {
        console.error("Error fetching event details:", error)
        setError("Failed to load event details. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventDetails()
  }, [eventId, token])

  const handleRegister = async () => {
    setIsRegistering(true)
    try {
      const response = await fetch(`/api/event/${eventId}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to register for event")
      }

      // Update the event data to reflect registration
      setEvent((prev) => {
        if (!prev) return null
        return {
          ...prev,
          isRegistered: true,
          attendees: prev.attendees + 1,
        }
      })

      toast({
        title: "Registration successful",
        description: "You have successfully registered for this event",
      })
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/event/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete event")
      }

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted",
      })
      router.push("/events")
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

  const canEdit =
    user?.role === "admin" ||
    user?.role === "manager" ||
    (user?.role === "organizer" && event?.organizer.id === user.id)

  const isEventPast = event ? new Date(event.date) < new Date() : false

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
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
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
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl font-medium mb-4">Event not found</p>
        <Button asChild>
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <div className="flex items-center mt-1">
            <Badge variant={isEventPast ? "outline" : "default"}>{isEventPast ? "Past Event" : "Upcoming"}</Badge>
            {event.isRegistered && (
              <Badge variant="outline" className="ml-2">
                Registered
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {canEdit && !isEventPast && (
            <>
              <Button asChild variant="outline">
                <Link href={`/events/${eventId}/edit`}>
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
                      This action cannot be undone. This will permanently delete the event and all associated data.
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
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none dark:prose-invert">
                <p>{event.description}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 opacity-70" />
                  <span>Date: {formatDate(event.date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 opacity-70" />
                  <span>Time: {event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 opacity-70" />
                  <span>Location: {event.location}</span>
                </div>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 opacity-70" />
                  <span>Organizer: {event.organizer.name}</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 opacity-70" />
                  <span>
                    Capacity: {event.attendees}/{event.capacity}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
                <CardDescription>
                  {isEventPast
                    ? "This event has already taken place"
                    : event.isRegistered
                      ? "You are registered for this event"
                      : "Register to attend this event"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEventPast ? (
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    This event took place on {formatDate(event.date)}
                  </div>
                ) : event.isRegistered ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    You're all set! We'll see you at the event.
                  </div>
                ) : event.attendees >= event.capacity ? (
                  <div className="text-destructive">This event has reached its capacity.</div>
                ) : (
                  <p className="mb-4">Secure your spot at this event by registering now.</p>
                )}
              </CardContent>
              <CardFooter>
                {!isEventPast && !event.isRegistered && event.attendees < event.capacity && (
                  <Button onClick={handleRegister} disabled={isRegistering} className="w-full">
                    {isRegistering ? "Registering..." : "Register Now"}
                  </Button>
                )}
                {event.isRegistered && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/attendance/${eventId}`}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark Attendance
                    </Link>
                  </Button>
                )}
                {isEventPast && event.isRegistered && (
                  <Button asChild className="w-full">
                    <Link href={`/feedback/${eventId}`}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Provide Feedback
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>
                {isEventPast
                  ? "View attendance information for this event"
                  : "Attendance tracking will be available during the event"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <div className="space-y-4">
                  <p>
                    {isEventPast
                      ? `${event.attendees} people attended this event`
                      : `${event.attendees} people have registered for this event`}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/attendance/${eventId}/list`}>
                        <Users className="mr-2 h-4 w-4" /> View Attendee List
                      </Link>
                    </Button>
                    {!isEventPast && (
                      <Button asChild>
                        <Link href={`/attendance/${eventId}/generate`}>
                          <Calendar className="mr-2 h-4 w-4" /> Generate Attendance Code
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {event.isRegistered ? (
                    <div className="space-y-4">
                      <p>
                        {isEventPast ? "Thank you for attending this event!" : "You are registered for this event."}
                      </p>
                      <Button asChild>
                        <Link href={`/attendance/${eventId}`}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {isEventPast ? "View Attendance Status" : "Mark Attendance"}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <p>You need to register for this event to access attendance features.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>
                {isEventPast ? "Share your thoughts about this event" : "Feedback will be available after the event"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEventPast ? (
                <div className="space-y-4">
                  {event.isRegistered ? (
                    <div>
                      <p>Your feedback helps us improve future events. Please share your thoughts!</p>
                      <Button asChild className="mt-4">
                        <Link href={`/feedback/${eventId}`}>
                          <MessageSquare className="mr-2 h-4 w-4" /> Provide Feedback
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <p>Only attendees can provide feedback for this event.</p>
                  )}
                  {canEdit && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-medium mb-2">Event Organizer Options</h3>
                      <Button asChild variant="outline">
                        <Link href={`/feedback/${eventId}/view`}>
                          <MessageSquare className="mr-2 h-4 w-4" /> View All Feedback
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p>Feedback collection will be available after the event has taken place.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

