"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, CheckCircle, Search } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Event = {
  id: string
  title: string
  date: string
  time: string
  location: string
  isRegistered: boolean
  hasAttended: boolean
}

export default function AttendancePage() {
  const { token, user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const isOrganizer = user?.role === "admin" || user?.role === "manager" || user?.role === "organizer"

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/event?registered=true", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch events")
        }

        const data = await response.json()
        setEvents(data)
        setFilteredEvents(data)
      } catch (error) {
        console.error("Error fetching events:", error)
        setError("Failed to load events. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [token])

  useEffect(() => {
    // Apply search filter
    if (searchQuery) {
      const filtered = events.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredEvents(filtered)
    } else {
      setFilteredEvents(events)
    }
  }, [events, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Manage attendance for your events</p>
        </div>
        {isOrganizer && (
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/attendance/manage">
              <Calendar className="mr-2 h-4 w-4" /> Manage Event Attendance
            </Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search events..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-4/5" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : error ? (
        <div>
          <p className="text-destructive">{error}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No registered events found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery ? "Try adjusting your search criteria" : "You haven't registered for any events yet"}
          </p>
          <Button asChild className="mt-4">
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" />
                  {formatDate(event.date)} • {event.time}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm mb-4">
                  <span className="line-clamp-1">{event.location}</span>
                </div>
                <div className="flex items-center mb-4">
                  {event.hasAttended ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Attendance Marked
                    </Badge>
                  ) : new Date(event.date) < new Date() ? (
                    <Badge variant="destructive">Missed</Badge>
                  ) : (
                    <Badge variant="outline">Not Attended Yet</Badge>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={event.hasAttended || new Date(event.date) > new Date()}
                  >
                    <Link href={`/attendance/${event.id}`}>
                      {event.hasAttended
                        ? "View Attendance"
                        : new Date(event.date) > new Date()
                          ? "Not Started Yet"
                          : "Mark Attendance"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isOrganizer && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Organizer Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>As an organizer, you can manage attendance for your events:</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline">
                <Link href="/attendance/manage">
                  <Calendar className="mr-2 h-4 w-4" /> Manage Event Attendance
                </Link>
              </Button>
              <Button asChild>
                <Link href="/attendance/generate">
                  <CheckCircle className="mr-2 h-4 w-4" /> Generate Attendance Code
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

