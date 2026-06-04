from .tasks import send_notification_task

def notify_member_removed(actor_id, member_user_id, member_email, group_id, group_name, send_email=True):
    send_notification_task.delay(
        user_id=member_user_id,
        notification_type='member_removed',
        title=f"Removed from {group_name}",
        message=f"You have been removed from the group <strong>{group_name}</strong>.",
        link=f"/groups",
        send_email=send_email,
        extra_context={'group_name': group_name}
    )
    
    send_notification_task.delay(
        user_id=actor_id,
        notification_type='member_removed',
        title=f"Member removed from {group_name}",
        message=f"You removed <strong>{member_email}</strong> from the group <strong>{group_name}</strong>.",
        link=f"/groups/{group_id}",
        send_email=False
    )

def notify_member_left(owner_id, user_email, group_id, group_name, send_email=True):
    send_notification_task.delay(
        user_id=owner_id,
        notification_type='member_left',
        title=f"Member left {group_name}",
        message=f"User <strong>{user_email}</strong> has left the group <strong>{group_name}</strong>.",
        link=f"/groups/{group_id}",
        send_email=send_email,
        extra_context={'group_name': group_name}
    )

def notify_ownership_transfer(new_owner_id, old_owner_id, group_id, group_name, new_owner_name, send_email=True):
    send_notification_task.delay(
        user_id=new_owner_id,
        notification_type='ownership_transfer',
        title=f"You are now the owner of {group_name}",
        message=f"Ownership of the group <strong>{group_name}</strong> has been transferred to you.",
        link=f"/groups/{group_id}",
        send_email=send_email,
        extra_context={'group_name': group_name}
    )
    
    send_notification_task.delay(
        user_id=old_owner_id,
        notification_type='ownership_transfer',
        title=f"Group ownership transferred",
        message=f"You have transferred ownership of <strong>{group_name}</strong> to <strong>{new_owner_name}</strong>.",
        link=f"/groups/{group_id}",
        send_email=send_email,
        extra_context={'group_name': group_name}
    )

def notify_role_change(user_id, actor_id, group_id, group_name, user_name, new_role, send_email=True):
    role_name = "an Admin" if new_role == 'admin' else "a Member"
    
    send_notification_task.delay(
        user_id=user_id,
        notification_type='role_change',
        title=f"Role updated in {group_name}",
        message=f"Your role in <strong>{group_name}</strong> has been updated to <strong>{role_name}</strong>.",
        link=f"/groups/{group_id}",
        send_email=send_email,
        extra_context={'group_name': group_name}
    )
    
    send_notification_task.delay(
        user_id=actor_id,
        notification_type='role_change',
        title=f"Member role updated",
        message=f"You updated <strong>{user_name}'s</strong> role to <strong>{role_name}</strong> in <strong>{group_name}</strong>.",
        link=f"/groups/{group_id}",
        send_email=False
    )

def notify_expense_added(group_id, group_name, created_by_id, created_by_name, title, participants, amount_str, send_email=True):
    for participant_id in participants:
        if participant_id != created_by_id:
            send_notification_task.delay(
                user_id=participant_id,
                notification_type='expense_added',
                title=f"New expense in {group_name}",
                message=f"<strong>{created_by_name}</strong> added a new expense: <strong>{title}</strong>.",
                link=f"/groups/{group_id}",
                send_email=send_email,
                extra_context={
                    'group_name': group_name,
                    'expense_title': title,
                    'actor_name': created_by_name,
                    'amount': amount_str
                }
            )

def notify_settlement(receiver_id, payer_name, amount, group_name, group_id, send_email=True):
    send_notification_task.delay(
        user_id=receiver_id,
        notification_type='settlement_confirmed',
        title=f"Payment received",
        message=f"<strong>{payer_name}</strong> has settled <strong>{amount}</strong> with you in group <strong>{group_name}</strong>.",
        link=f"/groups/{group_id}",
        send_email=send_email,
        extra_context={
            'group_name': group_name,
            'payer_name': payer_name,
            'amount': amount
        }
    )


