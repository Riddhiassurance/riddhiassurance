import leadModel from '../models/leadModel.js';
import consultationRequestModel from '../models/consultationRequestModel.js';
import notificationModel from '../models/notificationModel.js';

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const advisorFilter = (req) => req.user.role === 'admin' ? {} : { advisorId: req.user.userId };

export const advisorDashboard = async (req, res) => {
    try {
        const filter = advisorFilter(req);
        const leads = await leadModel.find(filter);
        const totalLeads = leads.length;
        const byStatus = leads.reduce((acc, lead) => ({ ...acc, [lead.status]: (acc[lead.status] || 0) + 1 }), {});
        const contacted = leads.filter((lead) => ['contacted', 'follow_up_required', 'interested', 'converted', 'closed'].includes(lead.status)).length;
        const converted = byStatus.converted || 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        res.json({
            success: true,
            stats: {
                totalLeads,
                newLeads: byStatus.new || 0,
                followUpLeads: byStatus.follow_up_required || 0,
                convertedLeads: converted,
                closedLeads: byStatus.closed || 0,
                leadsContacted: contacted,
                conversionRate: totalLeads ? Math.round((converted / totalLeads) * 100) : 0
            },
            followUps: {
                today: leads.filter((lead) => lead.nextFollowUpDate >= today && lead.nextFollowUpDate < tomorrow),
                overdue: leads.filter((lead) => lead.nextFollowUpDate && lead.nextFollowUpDate < today),
                upcoming: leads.filter((lead) => lead.nextFollowUpDate && lead.nextFollowUpDate >= tomorrow)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
};

export const assignedLeads = async (req, res) => {
    try {
        const { status, search = '' } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const userFilter = advisorFilter(req);
        if (status) userFilter.status = status;
        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            userFilter.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { phone: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
                { workProfile: { $regex: escaped, $options: 'i' } }
            ];
        }
        const [leads, total, allLeads] = await Promise.all([
            leadModel.find(userFilter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
            leadModel.countDocuments(userFilter),
            leadModel.find(advisorFilter(req))
        ]);
        const stats = {
            due: allLeads.filter(l => ['new', 'in_progress', 'pending'].includes(l.status)).length,
            completed: allLeads.filter(l => l.status === 'completed').length,
            total: allLeads.length
        };
        res.json({ success: true, leads, stats, pagination: { total, page, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch leads' });
    }
};

export const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, note, followUpDate, followUpTime, followUpNote, communication, conversion } = req.body;
        const filter = { _id: id, ...advisorFilter(req) };
        const update = {};
        if (status) update.status = status;
        if (priority) update.priority = priority;
        if (followUpDate) {
            update.nextFollowUpDate = new Date(`${followUpDate}T${followUpTime || '09:00'}`);
            update.nextFollowUpNote = followUpNote || '';
        }
        if (conversion) {
            update.converted = true;
            update.status = 'converted';
            update.productInterested = conversion.productInterested;
            update.policyType = conversion.policyType;
            update.premiumAmount = conversion.premiumAmount;
            update.conversionDate = new Date();
        }
        if (note) {
            update.$push = { notes: { content: note, createdBy: req.user.userId, createdAt: new Date(), updatedAt: new Date() } };
        }
        if (communication?.type && communication?.status) {
            update.$push = {
                ...(update.$push || {}),
                communications: { ...communication, timestamp: new Date() }
            };
            update.lastContactDate = new Date();
        }

        const lead = await leadModel.findOneAndUpdate(filter, update, { new: true });
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        await consultationRequestModel.findByIdAndUpdate(lead.consultationRequestId, {
            status: lead.status === 'interested' || lead.status === 'not_interested' ? 'contacted' : lead.status,
            priority: lead.priority
        });
        res.json({ success: true, message: 'Lead updated', lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update lead' });
    }
};

export const notifications = async (req, res) => {
    const items = await notificationModel.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, unreadCount: items.filter((item) => !item.read).length, notifications: items });
};

export const markNotificationRead = async (req, res) => {
    await notificationModel.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, { read: true, readAt: new Date() });
    res.json({ success: true, message: 'Notification marked read' });
};

export default { advisorDashboard, assignedLeads, updateLead, notifications, markNotificationRead };
