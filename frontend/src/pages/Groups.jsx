import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Users, Plus, X } from 'lucide-react';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onCreateGroup = async (data) => {
    try {
      await api.post('/groups', data);
      setIsModalOpen(false);
      reset();
      fetchGroups();
    } catch (err) {
      console.error('Failed to create group', err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Your Groups</h1>
          <p className="text-graphite mt-1">Manage your shared expenses.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {loading ? (
        <div className="text-graphite">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-border-soft p-12 text-center">
          <div className="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-medium text-charcoal mb-2">No groups yet</h3>
          <p className="text-graphite mb-6 max-w-sm mx-auto">
            You aren't part of any groups. Create one to start splitting expenses with friends.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-primary hover:text-primary-light font-medium transition-colors"
          >
            + Create your first group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl shadow-soft border border-border-soft p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-bg-card flex items-center justify-center text-xl">
                  {group.icon || '📦'}
                </div>
                <span className="text-xs font-medium text-graphite bg-bg-base px-2 py-1 rounded-md">
                  {group.members.length} members
                </span>
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-1 truncate">{group.name}</h3>
              <p className="text-sm text-graphite line-clamp-2 mb-4 flex-1">
                {group.description || 'No description provided.'}
              </p>
              <div className="pt-4 border-t border-border-soft text-sm font-medium text-primary hover:text-accent transition-colors">
                View Group &rarr;
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-soft border border-border-soft w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border-soft flex justify-between items-center">
              <h2 className="text-lg font-bold text-charcoal">Create New Group</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-graphite hover:text-charcoal transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onCreateGroup)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Group Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base"
                  placeholder="e.g. Miami Trip"
                />
                {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base resize-none"
                  placeholder="What is this group for?"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Icon/Emoji (Optional)</label>
                <input
                  {...register('icon')}
                  type="text"
                  className="w-full px-4 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-bg-base"
                  placeholder="🏖️"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
