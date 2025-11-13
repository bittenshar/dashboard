/**
 * EXAMPLE COMPONENT USING DUMMY DATA
 * 
 * This demonstrates how to use the dummy data in your components.
 * Replace the dummy API with real API when ready.
 */

import { useState, useEffect } from 'react';
import { useDummyApi } from '@/hooks/useDummyApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, Users, BarChart3 } from 'lucide-react';

const DummyDataExample = () => {
  const api = useDummyApi();
  const [selectedView, setSelectedView] = useState('users');

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Users ({api.users?.length || 0})</h3>
        <div className="flex gap-2">
          <Badge variant="outline">
            Verified: {api.users?.filter(u => u.verificationStatus === 'verified').length || 0}
          </Badge>
          <Badge variant="secondary">
            Pending: {api.users?.filter(u => u.verificationStatus === 'pending').length || 0}
          </Badge>
        </div>
      </div>
      
      {api.loading.users ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {api.users?.map(user => (
            <Card key={user._id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{user.name || user.fullName}</h4>
                  <Badge 
                    variant={user.verificationStatus === 'verified' ? 'default' : 'secondary'}
                  >
                    {user.verificationStatus}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                <p className="text-sm text-gray-600">{user.phone}</p>
                <div className="mt-2 flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {user.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Events ({api.events?.length || 0})</h3>
        <div className="flex gap-2">
          <Badge variant="outline">
            Active: {api.events?.filter(e => e.status === 'active').length || 0}
          </Badge>
          <Badge variant="secondary">
            Draft: {api.events?.filter(e => e.status === 'draft').length || 0}
          </Badge>
        </div>
      </div>
      
      {api.loading.events ? (
        <div className="text-center py-8">Loading events...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {api.events?.map(event => (
            <Card key={event._id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{event.name}</h4>
                  <Badge 
                    variant={event.status === 'active' ? 'default' : 'secondary'}
                  >
                    {event.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(event.date).toLocaleDateString()} at {event.startTime}
                </p>
                <div className="flex justify-between text-sm">
                  <span>Tickets: {event.ticketsSold}/{event.totalTickets}</span>
                  <span className="font-semibold">${event.ticketPrice}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Statistics</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{api.stats?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {api.stats?.users?.verified || 0} verified
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{api.stats?.events?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {api.stats?.events?.active || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{api.stats?.registrations?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {api.stats?.registrations?.verified || 0} verified
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${api.stats?.revenue?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${api.stats?.revenue?.thisMonth || 0} this month
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dummy Data Demo</h1>
        <div className="flex gap-2">
          <Button 
            variant={selectedView === 'users' ? 'default' : 'outline'}
            onClick={() => setSelectedView('users')}
          >
            Users
          </Button>
          <Button 
            variant={selectedView === 'events' ? 'default' : 'outline'}
            onClick={() => setSelectedView('events')}
          >
            Events
          </Button>
          <Button 
            variant={selectedView === 'stats' ? 'default' : 'outline'}
            onClick={() => setSelectedView('stats')}
          >
            Stats
          </Button>
        </div>
      </div>

      {selectedView === 'users' && renderUsers()}
      {selectedView === 'events' && renderEvents()}
      {selectedView === 'stats' && renderStats()}

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">How to use dummy data:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Import the dummy API hook: <code>import &#123; useDummyApi &#125; from '@/hooks/useDummyApi';</code></li>
          <li>Use in component: <code>const api = useDummyApi();</code></li>
          <li>Access data: <code>api.users</code>, <code>api.events</code>, etc.</li>
          <li>Check loading states: <code>api.loading.users</code></li>
          <li>Handle errors: <code>api.errors.users</code></li>
          <li>Call API methods: <code>api.createUser(userData)</code></li>
        </ol>
        <p className="text-sm mt-2 text-gray-600">
          Replace <code>useDummyApi</code> with <code>useApiContext</code> when ready to connect to real backend.
        </p>
      </div>
    </div>
  );
};

export default DummyDataExample;
