import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')
ecs = boto3.client('ecs')

def handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse the event
        detail = event.get('detail', {})
        last_status = detail.get('lastStatus')
        desired_status = detail.get('desiredStatus')
        cluster_arn = detail.get('clusterArn', '')
        
        # Check if this is a task starting event for our service
        if last_status == 'RUNNING' and desired_status == 'RUNNING':
            cluster_name = os.environ['CLUSTER_NAME']
            service_name = os.environ['SERVICE_NAME']
            eip_allocation_id = os.environ['EIP_ALLOCATION_ID']
            
            # Check if the cluster matches
            if cluster_name not in cluster_arn:
                logger.info(f"Event not for our cluster: {cluster_name}")
                return create_response("Event not for our cluster")
            
            task_arn = detail.get('taskArn')
            if not task_arn:
                logger.error("No task ARN found in event")
                return create_error_response("No task ARN found in event")
            
            # Process the task and manage EIP
            result = process_task_eip_assignment(
                cluster_name, 
                service_name, 
                eip_allocation_id, 
                task_arn
            )
            
            return result
                
    except Exception as e:
        logger.error(f"Error in handler: {str(e)}")
        return create_error_response(f"Handler error: {str(e)}")

def process_task_eip_assignment(cluster_name, service_name, eip_allocation_id, task_arn):
    """Process task and assign EIP to the corresponding EC2 instance"""
    try:
        # Get task details
        task_response = ecs.describe_tasks(
            cluster=cluster_name,
            tasks=[task_arn]
        )
        
        if not task_response['tasks']:
            logger.error(f"Task not found: {task_arn}")
            return create_error_response(f"Task not found: {task_arn}")
        
        task = task_response['tasks'][0]
        
        # Check if this task belongs to our service
        task_group = task.get('group', '')
        if f"service:{service_name}" not in task_group:
            logger.info(f"Task not for our service: {service_name}")
            return create_response(f"Task not for our service: {service_name}")
        
        container_instance_arn = task.get('containerInstanceArn')
        if not container_instance_arn:
            logger.error("No container instance ARN found")
            return create_error_response("No container instance ARN found")
        
        # Get EC2 instance ID from container instance
        ec2_instance_id = get_ec2_instance_from_container(cluster_name, container_instance_arn)
        if not ec2_instance_id:
            return create_error_response("Could not retrieve EC2 instance ID")
        
        # Manage EIP association
        association_result = manage_eip_association(eip_allocation_id, ec2_instance_id)
        return association_result
        
    except Exception as e:
        logger.error(f"Error processing task: {str(e)}")
        return create_error_response(f"Error processing task: {str(e)}")

def get_ec2_instance_from_container(cluster_name, container_instance_arn):
    """Get EC2 instance ID from container instance ARN"""
    try:
        ci_response = ecs.describe_container_instances(
            cluster=cluster_name,
            containerInstances=[container_instance_arn]
        )
        
        if not ci_response['containerInstances']:
            logger.error(f"Container instance not found: {container_instance_arn}")
            return None
        
        return ci_response['containerInstances'][0]['ec2InstanceId']
        
    except Exception as e:
        logger.error(f"Error getting EC2 instance: {str(e)}")
        return None

def manage_eip_association(eip_allocation_id, ec2_instance_id):
    """Manage EIP association with the EC2 instance"""
    try:
        # Check current EIP association
        addresses_response = ec2.describe_addresses(
            AllocationIds=[eip_allocation_id]
        )
        
        if not addresses_response['Addresses']:
            logger.error(f"EIP not found: {eip_allocation_id}")
            return create_error_response(f"EIP not found: {eip_allocation_id}")
        
        current_instance = addresses_response['Addresses'][0].get('InstanceId')
        
        if current_instance == ec2_instance_id:
            logger.info(f"EIP already associated with correct instance: {ec2_instance_id}")
            return create_response(f"EIP already associated with correct instance: {ec2_instance_id}")
        
        # Disassociate from old instance if needed
        if current_instance:
            logger.info(f"Disassociating EIP from old instance: {current_instance}")
            try:
                ec2.disassociate_address(AllocationId=eip_allocation_id)
                logger.info(f"Successfully disassociated EIP from instance: {current_instance}")
            except Exception as e:
                logger.warning(f"Could not disassociate EIP: {str(e)}")
        
        # Associate EIP with new instance
        logger.info(f"Associating EIP {eip_allocation_id} with instance {ec2_instance_id}")
        response = ec2.associate_address(
            InstanceId=ec2_instance_id,
            AllocationId=eip_allocation_id,
            AllowReassociation=True
        )
        
        association_id = response.get('AssociationId')
        logger.info(f"EIP association successful: {association_id}")
        
        return create_response(f"EIP successfully associated with instance {ec2_instance_id}")
        
    except Exception as e:
        logger.error(f"Error managing EIP association: {str(e)}")
        return create_error_response(f"Error managing EIP association: {str(e)}")

def create_response(message):
    """Create a successful response"""
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': message,
            'status': 'success'
        })
    }

def create_error_response(error_message):
    """Create an error response"""
    return {
        'statusCode': 500,
        'body': json.dumps({
            'error': error_message,
            'status': 'error'
        })
    }