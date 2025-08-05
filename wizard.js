module.exports = function(app){
    var Wizard = Object.getPrototypeOf(app).Wizard = new app.Component("wizard");
    // Wizard.debug = true;
    Wizard.createdAt      = "2.0.0";
    Wizard.lastUpdate     = "2.6.0";
    Wizard.version        = "1.0.1";
    // Wizard.factoryExclude = true;
    // Wizard.loadingMsg     = utils.renderError === undefined ? "utils.renderError function is not defined" : false;
    // Wizard.requires       = [];

    Wizard.prototype.onCreate = function(){
        var wizard = this;
        wizard.name         ??= wizard.$el.attr('name');
        wizard.$wrapper     ??= wizard.$el.closest('.wizard__container');
        wizard.mode         ??= wizard.getData('mode',false);
        wizard.required     ??= wizard.$el.attr('required')?true:false;
        wizard.renderErrors ??= wizard.getData('rendererrors',false);
        
        wizard.log(wizard);
        return wizard;
    }
    
    $(function(){
        $('body').on('click','.wizard__container .add,.wizard__container .duplicate',function(e){
            var original = $(this).closest('.wizard__group');
            var clone    = original.clone();
            var blnReset = $(this).hasClass('add');
            if(blnReset) clone.find('input,select').val('');
            if (app.components.includes('select2FW')) {
                clone.find('select').not('.custom').each(function(){
                    var wrapper = $(this).closest('.select2FW-wrapper');
                    var select = wrapper.find('select')[0];
                    select = $('<select></select>')
                        .attr('data-wizardKey',$(select).attr('data-wizardKey'))
                        .attr('multiple',$(select).attr('multiple'))
                        .html($(select).find('option').removeAttr('data-select2-id'));
                    wrapper.after(select);
                    wrapper.remove();
                    if (blnReset){
                        if (select.attr('multiple') === undefined)
                            select.val(select.find('option').first().attr('value'));
                        else
                            select.val(0);
                    }
                    else {
                        select.val(original.find('select[data-wizardKey="'+$(this).attr('data-wizardKey')+'"]').val());
                    }
                    select.select2FW();
                });
            }
            // TODO
            // if (app.components.includes('fileUploader')) {
            //     clone.find('.fileUploader__wrapper').each(function(){
            //         var input = $(this).find('input[type=file]').clone();
            //         var fileUp = original.find('.fileUploader__wrapper input[type=file]#'+input.attr('id')).fileUploader('get');

            //         input.attr(fileUp.dataAttr,fileUp.name);
            //         input.removeAttr('id');
            //         $(this).after(input);
            //         $(this).remove();
            //         input.fileUploader();
            //     });
            // }
            if (app.components.includes('datepicker')) {
                clone.find('input.datepicker').each(function(){
                    $(this).datepicker();
                })
            }
            $(this).closest('.wizard__container').append(clone);
        });

        $('body').on('click','.wizard__container .delete',function(e){
            $(this).closest('.wizard__group').remove()
        })
    });

    Wizard.prototype.getValue = function(wizard,container='body'){
        var wizard = this;
        var wizardName = $(wizard).attr('name');
        var results = {
            values: {},
            valid: true
        };
        var items = wizard.$wrapper.find('.wizard__group');
        // console.log('------------------------');
        // console.log('getValue',wizard.name,container,items);
        items.each(function(i,group){
            results.values[i]={};
            var nbEmpty = $(group).find('input,select').filter(function(){
                    return !$(this).val().length;
            }).length;
            if (Wizard.debug) 
                console.log('Nb empty fields in row '+i+' :',nbEmpty+'/'+$(group).find('input,select').length);
            if (nbEmpty < $(group).find('input,select').length) {
                $(group).find('input,select').each(function(k,input){
                    if ($(input).attr('data-wizardKey')) {
                        // WIZARD IS A FULL WIZARDKEY SYSTEM
                        if (!$(input).hasClass('wizard')) {
                            // INPUT CLASSIC
                            results.values[i][$(input).attr('data-wizardKey')] = $(input).val();
                            if($(input).attr('type') == 'checkbox' && $(input).isChecked())
                                results.values[i][$(input).attr('data-wizardKey')] = 1;
                            if($(input).attr('type') == 'checkbox' && !$(input).isChecked())
                                results.values[i][$(input).attr('data-wizardKey')] = 0;
                            if ($(input).hasClass('datepicker') && app.components.includes('datepicker')) 
                                results.values[i][$(input).attr('data-wizardKey')] = $(input).attr('data-tstamp');                       
                            if($.trim($(input).val()) == '' && $(input).attr('required')){
                                wizard.log('invalid wizard');
                                if (wizard.renderErrors) wizard.displayError(input);
                                results.valid = false;
                            } 
                        } else {
                            // INPUT IS A WIZARD - recursive time !
                            var wizardData = wizard.getValue($(input).clone().attr('name',input.getAttribute('data-wizardKey')),group);
                            results.values[i][$(input).attr('data-wizardKey')] = wizardData.values;
                            if (!wizardData.valid)
                                results.valid = false;
                        }
                    } else if($(input).hasClass('key') && $(input).siblings('.value').length){
                        // WIZARD IS A KEY/VALUE SYSTEM
                        if ($.trim($(input).val()) != '') {
                            results.values[i][$(input).val()] = $(input).siblings('.value').val();
                            if ($(input).siblings('.value').val().trim() == '') {
                                wizard.log('invalid wizard');
                                if (wizard.renderErrors) wizard.displayError(input);
                                results.valid = false;
                            }
                        }
                    }
                });
            }

            // remove empty rows
            if (wizard.mode != 'all' && utils.getObjSize(results.values[i]) == 0)
                delete results.values[i];
        });

        // wizard is required but there is no values --> result must be false
        if (wizard.required && utils.getObjSize(results.values) == 0){
            results.valid = false;
            results.values = "";
        }
        if (Wizard.debug) {
            console.log('------------- \nWizard debug getValue:');
            console.log('mode:'+wizard.mode);
            console.log('required:'+wizard.required);
            console.log('valid:'+results.valid);
            console.log(results.values);
        }
        return results;
    }

    Wizard.prototype.displayError = function(input,wizardName){
        var wizard = this;
        var labelError = wizard.name;
        if(wizard.$wrapper.find('label[for="'+labelError+'"]').first().length) // if exist, get label of the input
            labelError = wizard.$wrapper.find('label[for="'+labelError+'"]').first().html().replace(':','').trim();
        if ($(input).attr('placeholder'))
            labelError += ' ('+$(input).attr('placeholder')+')';
        else if ($(input).attr('data-wizardKey'))
            labelError += ' ('+$(input).attr('data-wizardKey')+')';
        else if ($(input).attr('name'))
            labelError += ' ('+$(input).attr('name')+')';

        utils.renderError(
            wizard.name+'_'+$(input).attr('data-wizardKey'), 
            app.labels.errors.inputs.empty[app.lang].replace('%s',labelError)
        );
    } 
    
    return Wizard;
}